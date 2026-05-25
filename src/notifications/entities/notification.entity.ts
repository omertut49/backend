import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column()
  type: string; // TASK_ASSIGNED | BUG_REPORTED | BUG_RESOLVED | COMMENT_MENTION | DEADLINE_REMINDER | PROJECT_MEMBER_ADDED

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  entityId: number;

  @Column({ nullable: true })
  entityType: string; // task | bug | project

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  user: User;
}
