import { IsString, IsOptional, MinLength, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
