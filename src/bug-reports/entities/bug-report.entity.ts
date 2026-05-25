import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  DeleteDateColumn, ManyToOne, ManyToMany, JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('bug_reports')
export class BugReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'medium' })
  severity: string; // low | medium | high | critical

  @Column({ default: 'open' })
  status: string; // open | in_progress | resolved | closed

  @Column({ type: 'text', nullable: true })
  reproductionSteps: string;

  @Column({ nullable: true })
  environment: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  reporter: User | null;

  @ManyToOne(() => User, { nullable: true })
  assignee: User | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => Task, { nullable: true })
  linkedTask: Task | null;

  @ManyToMany(() => Tag)
  @JoinTable({ name: 'bug_tags' })
  tags: Tag[];
}
