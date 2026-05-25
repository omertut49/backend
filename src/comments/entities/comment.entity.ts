import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';
import { BugReport } from '../../bug-reports/entities/bug-report.entity';
import { CommentReaction } from './comment-reaction.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isEdited: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  author: User | null;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'CASCADE' })
  task: Task | null;

  @ManyToOne(() => BugReport, { nullable: true, onDelete: 'CASCADE' })
  bug: BugReport | null;

  @ManyToOne(() => Comment, { nullable: true, onDelete: 'CASCADE' })
  parentComment: Comment | null;

  @OneToMany(() => Comment, (c) => c.parentComment)
  replies: Comment[];

  @OneToMany(() => CommentReaction, (r) => r.comment)
  reactions: CommentReaction[];
}
