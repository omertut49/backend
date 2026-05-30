import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PhasesService } from './phases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Player } from '../players/entities/player.entity';

@ApiTags('Phases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('phases')
export class PhasesController {
  constructor(private service: PhasesService) {}

  @Get()
  @ApiQuery({ name: 'gameId', required: true })
  findAll(@Query('gameId') gameId: string, @CurrentUser() player: Player) {
    return this.service.findWithProgress(gameId, player.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.findOne(id, player.id);
  }
}
