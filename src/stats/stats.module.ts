import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Game } from '../games/entities/game.entity';
import { GameSession } from '../game-sessions/entities/game-session.entity';
import { Player } from '../players/entities/player.entity';
import { Report } from '../reports/entities/report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, GameSession, Player, Report])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
