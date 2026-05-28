import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGameSessionDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsUUID()
  gameId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  score?: number;
}
