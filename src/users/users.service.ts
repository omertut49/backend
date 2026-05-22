import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existing = await this.usersRepository.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Bu email zaten kayıtlı');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({ ...dto, password: hashed });
    const saved = await this.usersRepository.save(user);
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

  async update(id: number, dto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    if (dto.password) {
      dto = { ...dto, password: await bcrypt.hash(dto.password, 10) };
    }
    await this.usersRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.usersRepository.delete(id);
  }

  private omitPassword(user: User): Omit<User, 'password'> {
    const { password: _, ...rest } = user;
    return rest as Omit<User, 'password'>;
  }
}
