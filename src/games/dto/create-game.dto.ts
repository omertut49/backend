import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGameDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['planning', 'in_progress', 'testing', 'released', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['action', 'rpg', 'puzzle', 'strategy', 'simulation', 'sports', 'other'])
  genre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;
}
