import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GameSessionsService } from './game-sessions.service';
import { CreateGameSessionDto } from './dto/create-game-session.dto';
import { UpdateGameSessionDto } from './dto/update-game-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Player } from '../players/entities/player.entity';

@ApiTags('Game Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('game-sessions')
export class GameSessionsController {
  constructor(private service: GameSessionsService) {}

  @Post()
  create(@Body() dto: CreateGameSessionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiQuery({ name: 'gameId', required: false })
  @ApiQuery({ name: 'playerId', required: false })
  findAll(@Query('gameId') gameId?: string, @Query('playerId') playerId?: string) {
    return this.service.findAll(gameId, playerId);
  }

  @Get('my')
  findMy(@CurrentUser() player: Player) {
    return this.service.findByPlayer(player.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGameSessionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
