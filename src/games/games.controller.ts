import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Player } from '../players/entities/player.entity';

@ApiTags('Games')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  constructor(private service: GamesService) {}

  @Post()
  create(@Body() dto: CreateGameDto, @CurrentUser() player: Player) {
    return this.service.create(dto, player.id);
  }

  @Get()
  findAll(@CurrentUser() player: Player) {
    return this.service.findAll(player.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.findOne(id, player.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGameDto, @CurrentUser() player: Player) {
    return this.service.update(id, dto, player.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.remove(id, player.id);
  }
}
