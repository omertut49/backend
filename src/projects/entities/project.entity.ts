import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from './project-member.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'active' })
  status: string; // planning | active | on_hold | completed

  @Column({ nullable: true })
  deadline: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  owner: User | null;

  @OneToMany(() => ProjectMember, (pm) => pm.project)
  members: ProjectMember[];
}
