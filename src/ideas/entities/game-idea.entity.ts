import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, ManyToMany, JoinTable, OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IdeaSession } from './idea-session.entity';
import { Mechanic } from './mechanic.entity';

@Entity('game_ideas')
export class GameIdea {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => IdeaSession, { onDelete: 'CASCADE' }) session: IdeaSession;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) proposer: User | null;
  @ManyToMany(() => User) @JoinTable({ name: 'game_idea_votes' }) voters: User[];
  @OneToMany(() => Mechanic, (m) => m.idea) mechanics: Mechanic[];
}
