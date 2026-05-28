import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateGameSessionDto } from './create-game-session.dto';

export class UpdateGameSessionDto extends PartialType(CreateGameSessionDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  completionNote?: string;
}
