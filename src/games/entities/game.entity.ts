import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { GameSession } from '../../game-sessions/entities/game-session.entity';
import { Report } from '../../reports/entities/report.entity';

export type GameStatus = 'planning' | 'in_progress' | 'testing' | 'released' | 'cancelled';
export type GameGenre = 'action' | 'rpg' | 'puzzle' | 'strategy' | 'simulation' | 'sports' | 'other';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: 'planning' })
  status: GameStatus;

  @Column({ default: 'other' })
  genre: GameGenre;

  @Column({ nullable: true })
  coverUrl: string;

  @ManyToOne(() => Player, { eager: false, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: Player;

  @Column({ nullable: true })
  ownerId: string;

  @OneToMany(() => GameSession, (gs) => gs.game)
  gameSessions: GameSession[];

  @OneToMany(() => Report, (r) => r.game)
  reports: Report[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
