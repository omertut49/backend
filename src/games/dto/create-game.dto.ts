import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsArray,
  IsIn,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GameGenre, GameStatus } from '../entities/game.entity';
import type { PhaseType } from '../../phases/entities/phase.entity';
import type { TaskPriority } from '../../tasks/entities/task.entity';

const PHASE_TYPES: PhaseType[] = [
  'concept_design',
  'prototype',
  'art_visual',
  'production',
  'test_balance',
  'polish',
  'release',
];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export class GameTaskSeedDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: PRIORITIES })
  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: TaskPriority;
}

export class GamePhaseSeedDto {
  @ApiProperty({ enum: PHASE_TYPES })
  @IsIn(PHASE_TYPES)
  type: PhaseType;

  @ApiProperty({ type: [GameTaskSeedDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GameTaskSeedDto)
  tasks: GameTaskSeedDto[];
}

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

  // Manuel oluşturmada şablon/özel görevler (faza göre gruplu). Yoksa proje boş 7 fazla açılır.
  @ApiPropertyOptional({ type: [GamePhaseSeedDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GamePhaseSeedDto)
  phases?: GamePhaseSeedDto[];
}
