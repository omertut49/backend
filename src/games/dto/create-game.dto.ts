import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GameGenre, GameStatus } from '../entities/game.entity';

export class CreateGameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['planning', 'in_progress', 'testing', 'released', 'cancelled'] })
  @IsOptional()
  @IsEnum(['planning', 'in_progress', 'testing', 'released', 'cancelled'])
  status?: GameStatus;

  @ApiPropertyOptional({ enum: ['action', 'rpg', 'puzzle', 'strategy', 'simulation', 'sports', 'other'] })
  @IsOptional()
  @IsEnum(['action', 'rpg', 'puzzle', 'strategy', 'simulation', 'sports', 'other'])
  genre?: GameGenre;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;
}
