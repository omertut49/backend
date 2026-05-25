import { IsString, IsOptional, IsNumber, IsIn, IsArray } from 'class-validator';

export class UpdateBugReportDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity?: string;

  @IsOptional()
  @IsIn(['open', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @IsOptional()
  @IsString()
  reproductionSteps?: string;

  @IsOptional()
  @IsString()
  environment?: string;

  @IsOptional()
  @IsNumber()
  assigneeId?: number;

  @IsOptional()
  @IsNumber()
  linkedTaskId?: number;

  @IsOptional()
  @IsArray()
  tagIds?: number[];
}
