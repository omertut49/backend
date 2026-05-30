import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({ description: 'Eklenecek kullanıcının kullanıcı adı' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({ enum: ['admin', 'member'], default: 'member' })
  @IsOptional()
  @IsEnum(['admin', 'member'])
  role?: 'admin' | 'member';
}
