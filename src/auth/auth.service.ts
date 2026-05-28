import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Player } from '../players/entities/player.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Player) private playerRepo: Repository<Player>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.playerRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Bu email zaten kullanılıyor');

    const hashed = await bcrypt.hash(dto.password, 10);
    const player = this.playerRepo.create({ ...dto, password: hashed });
    await this.playerRepo.save(player);

    return this.generateTokens(player);
  }

  async login(dto: LoginDto) {
    const player = await this.playerRepo.findOne({ where: { email: dto.email } });
    if (!player) throw new UnauthorizedException('Geçersiz email veya şifre');

    const valid = await bcrypt.compare(dto.password, player.password);
    if (!valid) throw new UnauthorizedException('Geçersiz email veya şifre');

    return this.generateTokens(player);
  }

  async refresh(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const player = await this.playerRepo.findOne({ where: { id: payload.sub } });
      if (!player || player.refreshToken !== token) throw new UnauthorizedException();
      return this.generateTokens(player);
    } catch {
      throw new UnauthorizedException('Geçersiz refresh token');
    }
  }

  async logout(playerId: string) {
    await this.playerRepo.update(playerId, { refreshToken: null });
    return { message: 'Çıkış yapıldı' };
  }

  private async generateTokens(player: Player) {
    const payload = { sub: player.id, email: player.email };

    const access_token = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    await this.playerRepo.update(player.id, { refreshToken: refresh_token });

    return {
      access_token,
      refresh_token,
      player: {
        id: player.id,
        email: player.email,
        username: player.username,
        avatarUrl: player.avatarUrl,
        role: player.role,
      },
    };
  }
}
