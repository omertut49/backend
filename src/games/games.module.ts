import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { ProjectMembersModule } from '../project-members/project-members.module';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Task, ProjectMember]), ProjectMembersModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
