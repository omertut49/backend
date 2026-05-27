import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('idea_sessions')
export class IdeaSession {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ default: 'open' }) status: string; // open | closed
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) creator: User | null;
}
