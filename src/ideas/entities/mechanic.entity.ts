import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, ManyToMany, JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GameIdea } from './game-idea.entity';

@Entity('mechanics')
export class Mechanic {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => GameIdea, (gi) => gi.mechanics, { onDelete: 'CASCADE' }) idea: GameIdea;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) proposer: User | null;
  @ManyToMany(() => User) @JoinTable({ name: 'mechanic_votes' }) voters: User[];
}
