import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existing = await this.usersRepository.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Bu email zaten kayıtlı');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({ ...dto, password: hashed });
    const saved = await this.usersRepository.save(user);

    this.eventEmitter.emit('activity.log', {
      action: 'CREATED', entity: 'user', entityId: saved.id,
      details: { name: saved.name, email: saved.email },
    });

    return this.omitPassword(saved);
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find();
    return users.map(this.omitPassword);
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`Kullanıcı ${id} bulunamadı`);
    return this.omitPassword(user);
  }

  async update(id: number, dto: UpdateUserDto, requesterId: number, requesterRole: string): Promise<Omit<User, 'password'>> {
    await this.findOne(id);

    if (requesterId !== id && requesterRole !== 'admin') {
      throw new ForbiddenException('Sadece kendi profilinizi güncelleyebilirsiniz');
    }

    if (dto.role && requesterRole !== 'admin') {
      throw new ForbiddenException('Rol değişikliği sadece admin tarafından yapılabilir');
    }

    if (dto.password) {
      const { currentPassword, ...rest } = dto;

      if (requesterId === id) {
        if (!currentPassword) throw new BadRequestException('Mevcut şifre gerekli');
        const userWithPw = await this.usersRepository
          .createQueryBuilder('user')
          .addSelect('user.password')
          .where('user.id = :id', { id })
          .getOne();
        if (!userWithPw || !await bcrypt.compare(currentPassword, userWithPw.password)) {
          throw new UnauthorizedException('Mevcut şifre yanlış');
        }
      }

      const hashed = await bcrypt.hash(rest.password!, 10);
      await this.usersRepository
        .createQueryBuilder()
        .update(User)
        .set({ ...rest, password: hashed, tokenVersion: () => '"tokenVersion" + 1' })
        .where('id = :id', { id })
        .execute();
    } else {
      const { currentPassword: _, ...rest } = dto;
      await this.usersRepository.update(id, rest);
    }

    this.eventEmitter.emit('activity.log', {
      action: 'UPDATED', entity: 'user', entityId: id,
      details: { updatedFields: Object.keys(dto) },
    });

    return this.findOne(id);
  }

  async resetPassword(id: number, newPassword: string): Promise<{ message: string }> {
    await this.findOne(id);
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(id, { password: hashed, tokenVersion: () => '"tokenVersion" + 1' } as any);
    return { message: 'Şifre sıfırlandı' };
  }

  async remove(id: number, requesterId: number, requesterRole: string): Promise<void> {
    if (requesterId === id) throw new ForbiddenException('Kendi hesabınızı silemezsiniz');
    if (requesterRole !== 'admin') throw new ForbiddenException('Sadece admin kullanıcı silebilir');
    await this.findOne(id);
    await this.usersRepository.softDelete(id);

    this.eventEmitter.emit('activity.log', {
      action: 'DELETED', entity: 'user', entityId: id, details: {},
    });
  }

  async getPerformance(id: number) {
    await this.findOne(id);
    return { userId: id, message: 'Performans raporu yakında' };
  }

  private omitPassword(user: User): Omit<User, 'password'> {
    const { password: _, ...rest } = user;
    return rest as Omit<User, 'password'>;
  }
}
