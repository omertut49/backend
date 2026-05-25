import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId → socketId eşlemesi
  private connectedUsers = new Map<number, string>();

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      this.connectedUsers.set(payload.sub, client.id);
      client.data.userId = payload.sub;

      // Kullanıcı kendi odasına giriyor (proje bazlı event'ler için)
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.connectedUsers.delete(client.data.userId);
    }
  }

  // Kullanıcı bir projeye ait odaya katılır → Kanban güncellemeleri için
  @SubscribeMessage('join-project')
  handleJoinProject(client: Socket, projectId: number) {
    client.join(`project:${projectId}`);
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(client: Socket, projectId: number) {
    client.leave(`project:${projectId}`);
  }

  // notification.create eventini dinler: DB'ye kaydeder ve WebSocket ile iletir
  @OnEvent('notification.create')
  async handleNotificationEvent(payload: {
    userId: number; message: string; type: string;
    entityId?: number; entityType?: string;
  }) {
    const notification = await this.notificationsService.handleNotificationCreate(payload);
    if (notification) {
      this.server.to(`user:${payload.userId}`).emit('notification', notification);
    }
  }

  // Task güncellenince proje odasına emit et → Kanban gerçek zamanlı
  @OnEvent('task.updated')
  handleTaskUpdated(payload: { projectId: number; task?: any }) {
    this.server.to(`project:${payload.projectId}`).emit('task-updated', payload.task);
  }
}
