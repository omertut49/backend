import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Report } from '../../reports/entities/report.entity';
import { Phase } from '../../phases/entities/phase.entity';
import { ProjectMember } from '../../project-members/entities/project-member.entity';

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

  @OneToMany(() => Phase, (p) => p.game)
  phases: Phase[];

  @OneToMany(() => ProjectMember, (m) => m.game)
  members: ProjectMember[];

  @OneToMany(() => Report, (r) => r.game)
  reports: Report[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
