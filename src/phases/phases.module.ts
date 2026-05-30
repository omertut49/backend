import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phase } from './entities/phase.entity';
import { Task } from '../tasks/entities/task.entity';
import { PhasesController } from './phases.controller';
import { PhasesService } from './phases.service';
import { ProjectMembersModule } from '../project-members/project-members.module';

@Module({
  imports: [TypeOrmModule.forFeature([Phase, Task]), ProjectMembersModule],
  controllers: [PhasesController],
  providers: [PhasesService],
  exports: [PhasesService],
})
export class PhasesModule {}
