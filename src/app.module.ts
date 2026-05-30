import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { buildTypeOrmConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { GamesModule } from './games/games.module';
import { ProjectMembersModule } from './project-members/project-members.module';
import { PhasesModule } from './phases/phases.module';
import { TasksModule } from './tasks/tasks.module';
import { ReportsModule } from './reports/reports.module';
import { IdeasModule } from './ideas/ideas.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: (parseInt(config.get('THROTTLE_TTL', '60'), 10) || 60) * 1000,
          limit: parseInt(config.get('THROTTLE_LIMIT', '10'), 10) || 10,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmConfig(config),
    }),
    AuthModule,
    PlayersModule,
    GamesModule,
    ProjectMembersModule,
    PhasesModule,
    TasksModule,
    ReportsModule,
    IdeasModule,
    StatsModule,
  ],
})
export class AppModule {}
