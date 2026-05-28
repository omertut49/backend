import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private service: LeaderboardService) {}

  @Get()
  @ApiQuery({ name: 'gameId', required: false })
  getLeaderboard(@Query('gameId') gameId?: string) {
    return this.service.getLeaderboard(gameId);
  }
}
