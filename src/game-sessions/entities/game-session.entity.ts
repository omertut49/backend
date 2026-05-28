import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Game } from '../../games/entities/game.entity';

export type SessionStatus = 'todo' | 'in_progress' | 'done';
export type SessionPriority = 'low' | 'medium' | 'high';

@Entity('game_sessions')
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: 'todo' })
  status: SessionStatus;

  @Column({ default: 'medium' })
  priority: SessionPriority;

  @Column({ nullable: true })
  completionNote: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ default: 0 })
  score: number;

  @ManyToOne(() => Player, (p) => p.gameSessions, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'playerId' })
  player: Player;

  @Column({ nullable: true })
  playerId: string;

  @ManyToOne(() => Game, (g) => g.gameSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column()
  gameId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
