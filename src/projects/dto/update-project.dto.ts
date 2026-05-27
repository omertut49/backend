import { IsString, IsOptional, MinLength, IsDateString } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
