import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notification_preferences')
@Unique(['user', 'type'])
export class NotificationPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column({ default: true })
  isEnabled: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
