import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Player } from './entities/player.entity';
import { UpdatePlayerDto } from './dto/update-player.dto';

const PUBLIC_SELECT = {
  id: true,
  username: true,
  avatarUrl: true,
  createdAt: true,
} as const;

@Injectable()
export class PlayersService {
  constructor(@InjectRepository(Player) private repo: Repository<Player>) {}

  search(query: string) {
    return this.repo.find({
      where: { username: ILike(`%${query}%`) },
      select: PUBLIC_SELECT,
      take: 20,
      order: { username: 'ASC' },
    });
  }

  async findOne(id: string, requesterId: string) {
    const player = await this.repo.findOne({
      where: { id },
      select: { ...PUBLIC_SELECT, email: true },
    });
    if (!player) throw new NotFoundException('Oyuncu bulunamadı');
    if (id !== requesterId) {
      const { email: _email, ...publicProfile } = player;
      return publicProfile;
    }
    return player;
  }

  async update(id: string, dto: UpdatePlayerDto) {
    await this.repo.update(id, dto);
    return this.findOne(id, id);
  }

  async remove(id: string) {
    const player = await this.repo.findOne({ where: { id } });
    if (!player) throw new NotFoundException('Oyuncu bulunamadı');
    await this.repo.remove(player);
    return { message: 'Oyuncu silindi' };
  }
}
