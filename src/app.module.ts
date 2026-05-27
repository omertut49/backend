import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { User } from './users/entities/user.entity';
import { Project } from './projects/entities/project.entity';
import { ProjectMember } from './projects/entities/project-member.entity';
import { Task } from './tasks/entities/task.entity';
import { Report } from './reports/entities/report.entity';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: (config.get<number>('THROTTLE_TTL') ?? 60) * 1000,
        limit: config.get<number>('THROTTLE_LIMIT') ?? 10,
      }]),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        entities: [User, Project, ProjectMember, Task, Report],
        synchronize: config.get('DB_SYNC') === 'true',
      }),
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    ReportsModule,
  ],
})
export class AppModule {}
