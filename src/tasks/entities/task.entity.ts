import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Game } from '../../games/entities/game.entity';
import { Phase } from '../../phases/entities/phase.entity';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: 'todo' })
  status: TaskStatus;

  @Column({ default: 'medium' })
  priority: TaskPriority;

  @Column({ nullable: true, type: 'date' })
  dueDate: Date;

  @Column({ nullable: true, type: 'text' })
  completionNote: string;

  @ManyToOne(() => Phase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phaseId' })
  phase: Phase;

  @Column()
  phaseId: string;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column()
  gameId: string;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: Player;

  @Column({ nullable: true })
  assigneeId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
