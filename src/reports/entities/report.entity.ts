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

export type ReportType = 'bug' | 'suggestion';
export type ReportStatus = 'open' | 'pending_approval' | 'resolved' | 'closed';
export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'bug' })
  type: ReportType;

  @Column({ default: 'open' })
  status: ReportStatus;

  @Column({ default: 'medium' })
  priority: ReportPriority;

  @Column({ nullable: true, type: 'text' })
  resolutionNote: string | null;

  @ManyToOne(() => Player, (p) => p.reports, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'playerId' })
  player: Player;

  @Column({ nullable: true })
  playerId: string;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'resolvedById' })
  resolvedBy: Player;

  @Column({ nullable: true })
  resolvedById: string | null;

  @ManyToOne(() => Game, (g) => g.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column()
  gameId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
