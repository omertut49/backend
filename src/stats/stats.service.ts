import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../games/entities/game.entity';
import { GameSession } from '../game-sessions/entities/game-session.entity';
import { Player } from '../players/entities/player.entity';
import { Report } from '../reports/entities/report.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    @InjectRepository(GameSession) private sessionRepo: Repository<GameSession>,
    @InjectRepository(Player) private playerRepo: Repository<Player>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
  ) {}

  async getDashboard(playerId: string) {
    const [totalGames, totalPlayers, totalSessions, openReports, mySessions, myCompletedSessions] =
      await Promise.all([
        this.gameRepo.count(),
        this.playerRepo.count(),
        this.sessionRepo.count(),
        this.reportRepo.count({ where: { status: 'open' } }),
        this.sessionRepo.count({ where: { playerId } }),
        this.sessionRepo.count({ where: { playerId, status: 'done' } }),
      ]);

    const recentSessions = await this.sessionRepo.find({
      where: { playerId },
      relations: { game: true },
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    return {
      totalGames,
      totalPlayers,
      totalSessions,
      openReports,
      mySessions,
      myCompletedSessions,
      recentSessions,
    };
  }
}
