import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from '../../games/entities/game.entity';

export type PhaseType =
  | 'concept_design'
  | 'prototype'
  | 'art_visual'
  | 'production'
  | 'test_balance'
  | 'polish'
  | 'release';

export const DEFAULT_PHASES: Array<{ type: PhaseType; name: string; order: number }> = [
  { type: 'concept_design', name: 'Konsept & Tasarım', order: 1 },
  { type: 'prototype', name: 'Prototip', order: 2 },
  { type: 'art_visual', name: 'Sanat & Görsel', order: 3 },
  { type: 'production', name: 'Prodüksiyon', order: 4 },
  { type: 'test_balance', name: 'Test & Dengeleme', order: 5 },
  { type: 'polish', name: 'Cila', order: 6 },
  { type: 'release', name: 'Yayın', order: 7 },
];

@Entity('phases')
export class Phase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  order: number;

  @Column({ default: 'concept_design' })
  type: PhaseType;

  @ManyToOne(() => Game, (g) => g.phases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column()
  gameId: string;

  @CreateDateColumn()
  createdAt: Date;
}
