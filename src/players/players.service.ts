import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(@InjectRepository(Player) private repo: Repository<Player>) {}

  findAll() {
    return this.repo.find({
      select: { id: true, email: true, username: true, avatarUrl: true, role: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const player = await this.repo.findOne({
      where: { id },
      select: { id: true, email: true, username: true, avatarUrl: true, role: true, createdAt: true },
    });
    if (!player) throw new NotFoundException('Oyuncu bulunamadı');
    return player;
  }

  async update(id: string, dto: UpdatePlayerDto) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const player = await this.repo.findOne({ where: { id } });
    if (!player) throw new NotFoundException('Oyuncu bulunamadı');
    await this.repo.remove(player);
    return { message: 'Oyuncu silindi' };
  }
}
