import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'todo' })
  status: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  assignee: User;

  @ManyToOne(() => Project)
  project: Project;
}