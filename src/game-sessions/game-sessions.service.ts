import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession } from './entities/game-session.entity';
import { CreateGameSessionDto } from './dto/create-game-session.dto';
import { UpdateGameSessionDto } from './dto/update-game-session.dto';

@Injectable()
export class GameSessionsService {
  constructor(@InjectRepository(GameSession) private repo: Repository<GameSession>) {}

  create(dto: CreateGameSessionDto) {
    const session = this.repo.create(dto as any);
    return this.repo.save(session);
  }

  findAll(gameId?: string, playerId?: string) {
    const where: any = {};
    if (gameId) where.gameId = gameId;
    if (playerId) where.playerId = playerId;
    return this.repo.find({
      where,
      relations: { player: true, game: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const session = await this.repo.findOne({
      where: { id },
      relations: { player: true, game: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı');
    return session;
  }

  async update(id: string, dto: UpdateGameSessionDto) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    const session = await this.repo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Oturum bulunamadı');
    await this.repo.remove(session);
    return { message: 'Oturum silindi' };
  }

  findByPlayer(playerId: string) {
    return this.repo.find({
      where: { playerId },
      relations: { game: true },
      order: { createdAt: 'DESC' },
    });
  }
}
