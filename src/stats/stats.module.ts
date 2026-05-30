import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Game } from '../games/entities/game.entity';
import { Task } from '../tasks/entities/task.entity';
import { Player } from '../players/entities/player.entity';
import { Report } from '../reports/entities/report.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Task, Player, Report, ProjectMember])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
