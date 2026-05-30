import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateIdeaDto {
  @ApiProperty({ example: 'Roguelike deckbuilder mobil oyun' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  prompt: string;
}
