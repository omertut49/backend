import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Game } from '../../games/entities/game.entity';
import { ReportComment } from './report-comment.entity';

export type ReportType = 'bug' | 'suggestion';
export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
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
  resolutionNote: string;

  @ManyToOne(() => Player, (p) => p.reports, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'playerId' })
  player: Player;

  @Column({ nullable: true })
  playerId: string;

  @ManyToOne(() => Game, (g) => g.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column()
  gameId: string;

  @OneToMany(() => ReportComment, (c) => c.report)
  comments: ReportComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
