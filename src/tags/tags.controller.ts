import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(
    @Body() dto: CreateTagDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.tagsService.create(dto, user.id, user.role);
  }

  @Get()
  findByProject(
    @Query('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.tagsService.findByProject(projectId, user.id, user.role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTagDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.tagsService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.tagsService.remove(id, user.id, user.role);
  }
}
