import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: { id: number }) {
    return this.projectsService.create(dto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: number }) {
    return this.projectsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.projectsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.projectsService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.projectsService.remove(id, user.id);
  }

  @Get(':id/members')
  getMembers(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.projectsService.getMembers(id, user.id);
  }

  @Post(':id/members')
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.projectsService.addMember(id, dto.userId, user.id);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.projectsService.removeMember(id, memberId, user.id);
  }
}
