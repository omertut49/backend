import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IdeasService } from './ideas.service';
import { GenerateIdeaDto } from './dto/generate-idea.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Player } from '../players/entities/player.entity';

@ApiTags('Ideas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ideas')
export class IdeasController {
  constructor(private service: IdeasService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('generate')
  generate(@Body() dto: GenerateIdeaDto, @CurrentUser() player: Player) {
    return this.service.generate(dto.prompt, player.id);
  }

  @Get('sessions')
  getSessions(@CurrentUser() player: Player) {
    return this.service.getSessions(player.id);
  }

  @Get('sessions/:id')
  getSession(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.getSession(id, player.id);
  }

  @Post('sessions/:id/confirm')
  confirmProject(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.confirmProject(id, player.id);
  }

  @Delete('sessions/:id')
  deleteSession(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.deleteSession(id, player.id);
  }
}
