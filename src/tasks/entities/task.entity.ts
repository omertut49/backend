import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  DeleteDateColumn, ManyToOne, ManyToMany, JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Milestone } from '../../milestones/entities/milestone.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'todo' })
  status: string; // todo | in_progress | done

  @Column({ default: 'medium' })
  priority: string; // low | medium | high

  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ type: 'float', default: 0 })
  estimatedHours: number;

  @Column({ type: 'float', default: 0 })
  loggedHours: number;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  assignee: User | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => Milestone, { nullable: true })
  milestone: Milestone | null;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  parentTask: Task | null;

  @ManyToMany(() => Tag)
  @JoinTable({ name: 'task_tags' })
  tags: Tag[];
}
