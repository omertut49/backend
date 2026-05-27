import { IsString, IsOptional } from 'class-validator';

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  status?: string; // open | resolved
}
