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
    const player = await this.playerRepo
      .createQueryBuilder('player')
      .addSelect('player.password')
      .where('player.email = :email', { email: dto.email })
      .getOne();
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
      // refreshToken kolonu entity'de select:false → doğrulama için açıkça iste.
      const player = await this.playerRepo
        .createQueryBuilder('player')
        .addSelect('player.refreshToken')
        .where('player.id = :id', { id: payload.sub })
        .getOne();
      if (!player || !player.refreshToken) throw new UnauthorizedException();

      const valid = await bcrypt.compare(token, player.refreshToken);
      if (!valid) throw new UnauthorizedException();

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
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const hashedRefresh = await bcrypt.hash(refresh_token, 10);
    await this.playerRepo.update(player.id, { refreshToken: hashedRefresh });

    return {
      access_token,
      refresh_token,
      player: {
        id: player.id,
        email: player.email,
        username: player.username,
        avatarUrl: player.avatarUrl,
      },
    };
  }
}
