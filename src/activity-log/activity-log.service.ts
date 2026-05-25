import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivityLog } from './entities/activity-log.entity';
import { User } from '../users/entities/user.entity';

interface ActivityPayload {
  userId: number;
  action: string;
  entity: string;
  entityId: number;
  projectId?: number;
  details?: object;
}

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private logsRepo: Repository<ActivityLog>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  @OnEvent('activity.log')
  async handleActivityLog(payload: ActivityPayload) {
    const user = await this.usersRepo.findOneBy({ id: payload.userId });

    const log = this.logsRepo.create({
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
      projectId: payload.projectId ?? undefined,
      details: payload.details ?? {},
      ...(user ? { user } : {}),
    });

    await this.logsRepo.save(log);
  }

  async findAll(filters: {
    userId?: number;
    entity?: string;
    page?: number;
    limit?: number;
  }) {
    const { userId, entity, page = 1, limit = 30 } = filters;

    const qb = this.logsRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (userId) qb.andWhere('user.id = :userId', { userId });
    if (entity) qb.andWhere('log.entity = :entity', { entity });

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
