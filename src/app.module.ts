import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { User } from './users/entities/user.entity';
import { Project } from './projects/entities/project.entity';
import { ProjectMember } from './projects/entities/project-member.entity';
import { UserStarredProject } from './projects/entities/user-starred-project.entity';
import { Milestone } from './milestones/entities/milestone.entity';
import { Tag } from './tags/entities/tag.entity';
import { Task } from './tasks/entities/task.entity';
import { BugReport } from './bug-reports/entities/bug-report.entity';
import { Comment } from './comments/entities/comment.entity';
import { CommentReaction } from './comments/entities/comment-reaction.entity';
import { Notification } from './notifications/entities/notification.entity';
import { NotificationPreference } from './notifications/entities/notification-preference.entity';
import { ActivityLog } from './activity-log/entities/activity-log.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { MilestonesModule } from './milestones/milestones.module';
import { TagsModule } from './tags/tags.module';
import { TasksModule } from './tasks/tasks.module';
import { BugReportsModule } from './bug-reports/bug-reports.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { StatsModule } from './stats/stats.module';

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
    EventEmitterModule.forRoot(),
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
        entities: [
          User, Project, ProjectMember, UserStarredProject,
          Milestone, Tag, Task, BugReport,
          Comment, CommentReaction,
          Notification, NotificationPreference,
          ActivityLog,
        ],
        synchronize: config.get('DB_SYNC') === 'true',
      }),
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    MilestonesModule,
    TagsModule,
    TasksModule,
    BugReportsModule,
    CommentsModule,
    NotificationsModule,
    ActivityLogModule,
    StatsModule,
  ],
})
export class AppModule {}
