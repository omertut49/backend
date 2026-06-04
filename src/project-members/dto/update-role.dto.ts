import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { MemberRole } from '../entities/project-member.entity';

export class UpdateRoleDto {
  @ApiProperty({ enum: ['admin', 'member'] })
  @IsEnum(['admin', 'member'])
  role: MemberRole;
}
