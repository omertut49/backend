import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, DeleteDateColumn, ManyToOne,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('milestones')
export class Milestone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'upcoming' })
  status: string; // upcoming | active | completed

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ type: 'float', default: 0 })
  progress: number; // 0-100 otomatik hesaplanır

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;
}
