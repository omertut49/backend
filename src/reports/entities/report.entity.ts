import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'bug' })
  type: string; // bug | suggestion

  @Column({ default: 'open' })
  status: string; // open | resolved

  @Column({ nullable: true })
  severity: string; // low | medium | high | critical (sadece bug için)

  @Column({ type: 'text', nullable: true })
  resolutionNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  reporter: User | null;
}
