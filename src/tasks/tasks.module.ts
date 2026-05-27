import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, ProjectMember, User])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
