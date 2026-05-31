import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GameGenre } from '../../games/entities/game.entity';
import type { PhaseType } from '../../phases/entities/phase.entity';
import type { TaskPriority } from '../../tasks/entities/task.entity';

const GENRES: GameGenre[] = ['action', 'rpg', 'puzzle', 'strategy', 'simulation', 'sports', 'other'];
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

export class ConfirmTaskDto {
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

export class ConfirmPhaseDto {
  @ApiProperty({ enum: PHASE_TYPES })
  @IsIn(PHASE_TYPES)
  type: PhaseType;

  @ApiProperty({ type: [ConfirmTaskDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmTaskDto)
  tasks: ConfirmTaskDto[];
}

export class ConfirmProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  projectName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  projectDescription: string;

  @ApiPropertyOptional({ enum: GENRES })
  @IsOptional()
  @IsIn(GENRES)
  genre?: GameGenre;

  @ApiProperty({ type: [ConfirmPhaseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmPhaseDto)
  phases: ConfirmPhaseDto[];
}
