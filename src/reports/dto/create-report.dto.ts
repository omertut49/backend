import { IsString, IsOptional, MinLength, IsNumber } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  type: string; // bug | suggestion

  @IsOptional()
  @IsString()
  severity?: string; // low | medium | high | critical

  @IsNumber()
  projectId: number;
}
