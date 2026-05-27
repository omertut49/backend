import { IsString, IsOptional, IsDateString, IsIn, IsBoolean } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsDateString()
  deadline?: Date;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  mechanics?: string;
}
