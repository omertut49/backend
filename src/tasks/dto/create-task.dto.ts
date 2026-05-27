import { IsString, IsOptional, MinLength, IsNumber, IsDateString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsNumber()
  projectId: number;

  @IsOptional()
  @IsNumber()
  assigneeId?: number;
}
