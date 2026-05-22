import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateBugReportDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  reporterId?: number;

  @IsOptional()
  @IsNumber()
  projectId?: number;
}