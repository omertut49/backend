import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchPlayersDto {
  @ApiProperty({ example: 'ali' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  q: string;
}
