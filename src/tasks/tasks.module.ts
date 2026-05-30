import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Phase } from '../phases/entities/phase.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ProjectMembersModule } from '../project-members/project-members.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Phase]), ProjectMembersModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
