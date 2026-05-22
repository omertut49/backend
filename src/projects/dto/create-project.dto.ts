import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateProjectDto {
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
  @IsDateString()
  deadline?: Date;

  @IsOptional()
  @IsNumber()
  ownerId?: number;
}