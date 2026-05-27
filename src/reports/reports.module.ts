import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';
import { ReportComment } from './entities/report-comment.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, ReportComment, ProjectMember])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
