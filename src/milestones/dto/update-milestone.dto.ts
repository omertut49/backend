import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['upcoming', 'active', 'completed'])
  status?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}
