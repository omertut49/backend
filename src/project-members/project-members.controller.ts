import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectMembersService } from './project-members.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Player } from '../players/entities/player.entity';

@ApiTags('Project Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('games/:gameId/members')
export class ProjectMembersController {
  constructor(private service: ProjectMembersService) {}

  @Get()
  getMembers(@Param('gameId') gameId: string, @CurrentUser() player: Player) {
    return this.service.getMembers(gameId, player.id);
  }

  @Post()
  addMember(
    @Param('gameId') gameId: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() player: Player,
  ) {
    return this.service.addMember(gameId, dto.username, dto.role, player.id);
  }

  @Patch(':memberId/role')
  updateRole(
    @Param('gameId') gameId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() player: Player,
  ) {
    return this.service.updateRole(gameId, memberId, dto.role, player.id);
  }

  @Delete(':memberId')
  removeMember(
    @Param('gameId') gameId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() player: Player,
  ) {
    return this.service.removeMember(gameId, memberId, player.id);
  }
}
