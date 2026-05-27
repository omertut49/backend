import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';

@Entity('project_members')
export class ProjectMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'member' })
  role: string; // owner | member

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Project, (p) => p.members, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, (u) => u.projectMemberships, { onDelete: 'CASCADE' })
  user: User;
}
