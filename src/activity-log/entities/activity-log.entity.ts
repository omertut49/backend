import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string; // CREATED | UPDATED | DELETED | ASSIGNED | RESOLVED

  @Column()
  entity: string; // task | bug | project | milestone | comment

  @Column()
  entityId: number;

  @Column({ nullable: true })
  projectId: number;

  @Column({ type: 'jsonb', nullable: true })
  details: object;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  user: User;
}
