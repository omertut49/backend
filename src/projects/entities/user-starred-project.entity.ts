import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';

@Entity('user_starred_projects')
export class UserStarredProject {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  starredAt: Date;

  @ManyToOne(() => User, (u) => u.starredProjects)
  user: User | null;

  @ManyToOne(() => Project, (p) => p.starredBy, { onDelete: 'CASCADE' })
  project: Project | null;
}
