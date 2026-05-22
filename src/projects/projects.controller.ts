import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: { id: number }) {
    return this.projectsService.create({ ...dto, ownerId: dto.ownerId ?? user.id });
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser() user: { id: number }) {
    return this.projectsService.update(+id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: number }) {
    return this.projectsService.remove(+id, user.id);
  }
}
