import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, DeleteDateColumn, ManyToOne, OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from './project-member.entity';
import { UserStarredProject } from './user-starred-project.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'planning' })
  status: string; // planning | active | on_hold | completed | cancelled

  @Column({ nullable: true })
  deadline: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: '#6366f1' })
  color: string;

  @Column({ nullable: true })
  genre: string;

  @Column({ nullable: true })
  platform: string;

  @Column({ nullable: true })
  targetAudience: string;

  @Column({ type: 'text', nullable: true })
  mechanics: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User)
  owner: User;

  @OneToMany(() => ProjectMember, (pm) => pm.project)
  members: ProjectMember[];

  @OneToMany(() => UserStarredProject, (usp) => usp.project)
  starredBy: UserStarredProject[];
}
