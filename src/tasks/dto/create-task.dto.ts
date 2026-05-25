import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsIn, IsArray } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'done'])
  status?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  assigneeId?: number;

  @IsNumber()
  projectId: number;

  @IsOptional()
  @IsNumber()
  milestoneId?: number;

  @IsOptional()
  @IsNumber()
  parentTaskId?: number;

  @IsOptional()
  @IsArray()
  tagIds?: number[];
}
