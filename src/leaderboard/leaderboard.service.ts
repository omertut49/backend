import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession } from '../game-sessions/entities/game-session.entity';
import { Player } from '../players/entities/player.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(GameSession) private sessionRepo: Repository<GameSession>,
    @InjectRepository(Player) private playerRepo: Repository<Player>,
  ) {}

  async getLeaderboard(gameId?: string) {
    const qb = this.sessionRepo
      .createQueryBuilder('gs')
      .leftJoin('gs.player', 'player')
      .select('player.id', 'playerId')
      .addSelect('player.username', 'username')
      .addSelect('player.avatarUrl', 'avatarUrl')
      .addSelect('COUNT(gs.id)', 'totalSessions')
      .addSelect('SUM(CASE WHEN gs.status = :done THEN 1 ELSE 0 END)', 'completedSessions')
      .addSelect('SUM(gs.score)', 'totalScore')
      .where('player.id IS NOT NULL')
      .groupBy('player.id')
      .orderBy('totalScore', 'DESC')
      .addOrderBy('completedSessions', 'DESC')
      .setParameter('done', 'done');

    if (gameId) {
      qb.andWhere('gs.gameId = :gameId', { gameId });
    }

    const results = await qb.getRawMany();

    return results.map((r, index) => ({
      rank: index + 1,
      playerId: r.playerId,
      username: r.username,
      avatarUrl: r.avatarUrl,
      totalSessions: parseInt(r.totalSessions),
      completedSessions: parseInt(r.completedSessions),
      totalScore: parseInt(r.totalScore) || 0,
    }));
  }
}
