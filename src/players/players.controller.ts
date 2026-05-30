import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { SearchPlayersDto } from './dto/search-players.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Player } from './entities/player.entity';

@ApiTags('Players')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('players')
export class PlayersController {
  constructor(private service: PlayersService) {}

  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  search(@Query() query: SearchPlayersDto) {
    return this.service.search(query.q);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.findOne(id, player.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() player: Player, @Body() dto: UpdatePlayerDto) {
    return this.service.update(player.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() player: Player) {
    if (player.id !== id) throw new ForbiddenException('Sadece kendi hesabınızı silebilirsiniz');
    return this.service.remove(id);
  }
}
