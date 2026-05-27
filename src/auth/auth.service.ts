import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.email = :email', { email: dto.email })
      .getOne();
    if (existing) throw new ConflictException('Bu email zaten kayıtlı');

    // First registered user automatically becomes admin
    const count = await this.usersRepository.count();
    const role = count === 0 ? 'admin' : (dto.role ?? 'developer');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({ ...dto, password: hashed, role });
    try {
      await this.usersRepository.save(user);
    } catch (err: unknown) {
      const pg = err as { code?: string };
      if (pg.code === '23505') throw new ConflictException('Bu email zaten kayıtlı');
      throw err;
    }

    return this.signTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user) throw new UnauthorizedException('Email veya şifre hatalı');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Email veya şifre hatalı');

    await this.usersRepository.update(user.id, { lastLoginAt: new Date() });

    return this.signTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersRepository.findOneBy({ id: payload.sub });
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException();
      }
      return this.signTokens(user);
    } catch {
      throw new UnauthorizedException('Geçersiz refresh token');
    }
  }

  async logoutAll(userId: number) {
    await this.usersRepository.increment({ id: userId }, 'tokenVersion', 1);
    return { message: 'Tüm cihazlardan çıkış yapıldı' };
  }

  private signTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
      }),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
    };
  }
}
