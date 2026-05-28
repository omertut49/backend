import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportComment } from '../reports/entities/report-comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportComment])],
})
export class CommentsModule {}
