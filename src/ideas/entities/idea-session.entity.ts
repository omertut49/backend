import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { GameIdea } from './game-idea.entity';

@Entity('idea_sessions')
export class IdeaSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  aiSummary: string;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: Player;

  @Column({ nullable: true })
  createdById: string;

  @OneToMany(() => GameIdea, (i) => i.session)
  ideas: GameIdea[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
