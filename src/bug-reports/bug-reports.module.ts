import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BugReportsController } from './bug-reports.controller';
import { BugReportsService } from './bug-reports.service';
import { BugReport } from './entities/bug-report.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BugReport, User, Project])],
  controllers: [BugReportsController],
  providers: [BugReportsService],
  exports: [BugReportsService],
})
export class BugReportsModule {}