import {
  Controller, Get, Post, Delete, Body, Param,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IdeasService } from './ideas.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Ideas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get()
  findAll() {
    return this.ideasService.findAll();
  }

  @Post()
  create(@Body() dto: CreateSessionDto, @CurrentUser() user: { id: number }) {
    return this.ideasService.create(dto.title, dto.description, user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.ideasService.findOne(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.ideasService.remove(id, user.id);
  }

  @Post(':id/ideas')
  addIdea(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateIdeaDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.ideasService.addIdea(id, dto.title, dto.description, user.id);
  }

  @Delete(':id/ideas/:ideaId')
  removeIdea(@Param('ideaId', ParseIntPipe) ideaId: number, @CurrentUser() user: { id: number }) {
    return this.ideasService.removeIdea(ideaId, user.id);
  }

  @Post(':id/ideas/:ideaId/vote')
  toggleIdeaVote(@Param('ideaId', ParseIntPipe) ideaId: number, @CurrentUser() user: { id: number }) {
    return this.ideasService.toggleIdeaVote(ideaId, user.id);
  }

  @Post(':id/ideas/:ideaId/mechanics')
  addMechanic(
    @Param('ideaId', ParseIntPipe) ideaId: number,
    @Body() dto: CreateMechanicDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.ideasService.addMechanic(ideaId, dto.title, dto.description, user.id);
  }

  @Delete(':id/ideas/:ideaId/mechanics/:mechId')
  removeMechanic(@Param('mechId', ParseIntPipe) mechId: number, @CurrentUser() user: { id: number }) {
    return this.ideasService.removeMechanic(mechId, user.id);
  }

  @Post(':id/ideas/:ideaId/mechanics/:mechId/vote')
  toggleMechanicVote(@Param('mechId', ParseIntPipe) mechId: number, @CurrentUser() user: { id: number }) {
    return this.ideasService.toggleMechanicVote(mechId, user.id);
  }

  @Post(':id/ai-summary')
  getAiSummary(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.ideasService.getAiSummary(id, user.id);
  }
}
