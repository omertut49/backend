import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsNumber()
  assigneeId?: number;

  @IsOptional()
  @IsNumber()
  projectId?: number;
}