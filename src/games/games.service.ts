import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(@InjectRepository(Game) private repo: Repository<Game>) {}

  create(dto: CreateGameDto, ownerId: string) {
    const game = this.repo.create({ ...dto, ownerId } as any);
    return this.repo.save(game);
  }

  findAll() {
    return this.repo.find({
      relations: { owner: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const game = await this.repo.findOne({
      where: { id },
      relations: { owner: true, gameSessions: { player: true }, reports: true },
    });
    if (!game) throw new NotFoundException('Oyun bulunamadı');
    return game;
  }

  async update(id: string, dto: UpdateGameDto) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    const game = await this.repo.findOne({ where: { id } });
    if (!game) throw new NotFoundException('Oyun bulunamadı');
    await this.repo.remove(game);
    return { message: 'Oyun silindi' };
  }
}
