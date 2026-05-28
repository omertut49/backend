import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}

  findAll(playerId: string) {
    return this.repo.find({ where: { playerId }, order: { createdAt: 'DESC' } });
  }

  async markRead(id: string) {
    await this.repo.update(id, { isRead: true });
    return { message: 'Okundu olarak işaretlendi' };
  }

  async markAllRead(playerId: string) {
    await this.repo.update({ playerId, isRead: false }, { isRead: true });
    return { message: 'Tümü okundu' };
  }

  create(data: { playerId: string; title: string; message: string; link?: string }) {
    const notif = this.repo.create(data);
    return this.repo.save(notif);
  }

  countUnread(playerId: string) {
    return this.repo.count({ where: { playerId, isRead: false } });
  }
}
