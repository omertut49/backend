import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateIdeaDto {
  @IsString() @MinLength(1) title: string;
  @IsOptional() @IsString() description?: string;
}
