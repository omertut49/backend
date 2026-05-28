import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { GameSession } from '../../game-sessions/entities/game-session.entity';
import { Report } from '../../reports/entities/report.entity';
import { Notification } from '../../notifications/entities/notification.entity';

export type PlayerRole = 'developer' | 'designer' | 'tester' | 'manager';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: 'developer' })
  role: PlayerRole;

  @Column({ nullable: true, type: 'text' })
  refreshToken: string | null;

  @OneToMany(() => GameSession, (gs) => gs.player)
  gameSessions: GameSession[];

  @OneToMany(() => Report, (r) => r.player)
  reports: Report[];

  @OneToMany(() => Notification, (n) => n.player)
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
