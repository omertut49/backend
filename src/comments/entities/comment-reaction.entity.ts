import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';

@Entity('comment_reactions')
@Unique(['comment', 'user', 'emoji'])
export class CommentReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  emoji: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  comment: Comment;

  @ManyToOne(() => User, { nullable: true })
  user: User | null;
}
