import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IdeaSession } from './idea-session.entity';
import { Player } from '../../players/entities/player.entity';

@Entity('game_ideas')
export class GameIdea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: 0 })
  votes: number;

  @ManyToOne(() => IdeaSession, (s) => s.ideas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: IdeaSession;

  @Column()
  sessionId: string;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: Player;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
