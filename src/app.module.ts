import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { GamesModule } from './games/games.module';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { ReportsModule } from './reports/reports.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IdeasModule } from './ideas/ideas.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get('DB_SYNC') === 'true',
        ssl: { rejectUnauthorized: false },
      }),
    }),
    AuthModule,
    PlayersModule,
    GamesModule,
    GameSessionsModule,
    ReportsModule,
    CommentsModule,
    NotificationsModule,
    IdeasModule,
    LeaderboardModule,
    StatsModule,
  ],
})
export class AppModule {}
