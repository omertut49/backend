import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IdeasService } from './ideas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Player } from '../players/entities/player.entity';

@ApiTags('Ideas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ideas')
export class IdeasController {
  constructor(private service: IdeasService) {}

  @Post('sessions')
  createSession(@Body('title') title: string, @CurrentUser() player: Player) {
    return this.service.createSession(title, player.id);
  }

  @Get('sessions')
  findAllSessions() {
    return this.service.findAllSessions();
  }

  @Get('sessions/:id')
  findSession(@Param('id') id: string) {
    return this.service.findSession(id);
  }

  @Delete('sessions/:id')
  deleteSession(@Param('id') id: string) {
    return this.service.deleteSession(id);
  }

  @Post('sessions/:id/ideas')
  addIdea(
    @Param('id') sessionId: string,
    @Body('title') title: string,
    @Body('description') description: string,
    @CurrentUser() player: Player,
  ) {
    return this.service.addIdea(sessionId, title, description, player.id);
  }

  @Post('ideas/:id/vote')
  vote(@Param('id') id: string) {
    return this.service.vote(id);
  }

  @Post('sessions/:id/summary')
  generateSummary(@Param('id') id: string) {
    return this.service.generateSummary(id);
  }

  @Post('sessions/:id/project-plan')
  generateProjectPlan(@Param('id') id: string) {
    return this.service.generateProjectPlan(id);
  }
}
