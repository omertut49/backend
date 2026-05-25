import { IsString, IsNotEmpty, IsOptional, IsDateString, IsIn, IsNumber } from 'class-validator';

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['upcoming', 'active', 'completed'])
  status?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsNumber()
  projectId: number;
}
