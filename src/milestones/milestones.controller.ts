import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Milestones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  create(
    @Body() dto: CreateMilestoneDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.milestonesService.create(dto, user.id, user.role);
  }

  @Get()
  findByProject(
    @Query('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.milestonesService.findByProject(projectId, user.id, user.role);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.milestonesService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMilestoneDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.milestonesService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.milestonesService.remove(id, user.id, user.role);
  }
}
