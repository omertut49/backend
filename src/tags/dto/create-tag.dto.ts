import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsNumber()
  projectId: number;
}
