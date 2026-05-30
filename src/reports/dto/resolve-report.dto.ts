import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveReportDto {
  @ApiProperty({ description: 'Çözüm açıklaması' })
  @IsString()
  @IsNotEmpty()
  resolutionNote: string;
}
