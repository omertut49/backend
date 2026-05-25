import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { User } from '../users/entities/user.entity';

interface NotificationPayload {
  userId: number;
  message: string;
  type: string;
  entityId?: number;
  entityType?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferencesRepo: Repository<NotificationPreference>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async handleNotificationCreate(payload: NotificationPayload) {
    const isEnabled = await this.isTypeEnabled(payload.userId, payload.type);
    if (!isEnabled) return;

    const user = await this.usersRepo.findOneBy({ id: payload.userId });
    if (!user) return;

    const notification = this.notificationsRepo.create({
      message: payload.message,
      type: payload.type,
      entityId: payload.entityId,
      entityType: payload.entityType,
      user,
    });

    return this.notificationsRepo.save(notification);
  }

  async findAll(userId: number, page = 1, limit = 20) {
    const [data, total] = await this.notificationsRepo.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notificationsRepo.count({
      where: { user: { id: userId }, isRead: false },
    });

    return { data, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markAsRead(id: number, userId: number) {
    await this.notificationsRepo.update(
      { id, user: { id: userId } },
      { isRead: true },
    );
    return { message: 'Bildirim okundu olarak işaretlendi' };
  }

  async markAllAsRead(userId: number) {
    await this.notificationsRepo.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
    return { message: 'Tüm bildirimler okundu olarak işaretlendi' };
  }

  async getPreferences(userId: number) {
    const types = [
      'TASK_ASSIGNED', 'BUG_REPORTED', 'BUG_RESOLVED',
      'COMMENT_MENTION', 'DEADLINE_REMINDER', 'PROJECT_MEMBER_ADDED',
    ];

    const existing = await this.preferencesRepo.find({
      where: { user: { id: userId } },
    });

    const missingTypes = types.filter((type) => !existing.find((p) => p.type === type));

    if (missingTypes.length > 0) {
      const user = await this.usersRepo.findOneBy({ id: userId });
      const newPrefs = missingTypes.map((type) =>
        this.preferencesRepo.create({ type, isEnabled: true, ...(user ? { user } : {}) }),
      );
      const saved = await this.preferencesRepo.save(newPrefs);
      existing.push(...saved);
    }

    return types.map((type) => existing.find((p) => p.type === type));
  }

  async updatePreference(userId: number, type: string, isEnabled: boolean) {
    const user = await this.usersRepo.findOneBy({ id: userId });
    let pref = await this.preferencesRepo.findOne({
      where: { user: { id: userId }, type },
    });

    if (!pref) {
      pref = this.preferencesRepo.create({ type, isEnabled, ...(user ? { user } : {}) });
    } else {
      pref.isEnabled = isEnabled;
    }

    return this.preferencesRepo.save(pref);
  }

  private async isTypeEnabled(userId: number, type: string): Promise<boolean> {
    const pref = await this.preferencesRepo.findOne({
      where: { user: { id: userId }, type },
    });
    return pref ? pref.isEnabled : true;
  }
}
