import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateMechanicDto {
  @IsString() @MinLength(1) title: string;
  @IsOptional() @IsString() description?: string;
}
