import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('bug_reports')
export class BugReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'medium' })
  severity: string;

  @Column({ default: 'open' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  reporter: User;

  @ManyToOne(() => Project)
  project: Project;
}