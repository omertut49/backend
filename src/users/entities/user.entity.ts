import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, DeleteDateColumn, OneToMany,
} from 'typeorm';
import { ProjectMember } from '../../projects/entities/project-member.entity';
import { UserStarredProject } from '../../projects/entities/user-starred-project.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: 'developer' })
  role: string; // admin | developer | designer

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  tokenVersion: number;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => ProjectMember, (pm) => pm.user)
  projectMemberships: ProjectMember[];

  @OneToMany(() => UserStarredProject, (usp) => usp.user)
  starredProjects: UserStarredProject[];
}
