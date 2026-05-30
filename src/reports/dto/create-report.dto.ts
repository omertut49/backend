import { IsString, IsOptional, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ReportPriority, ReportType } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsUUID()
  gameId: string;

  @ApiPropertyOptional({ enum: ['bug', 'suggestion'] })
  @IsOptional()
  @IsEnum(['bug', 'suggestion'])
  type?: ReportType;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: ReportPriority;
}
