import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { ProjectMember } from '../../projects/entities/project-member.entity';

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

  @Column({ default: 0 })
  tokenVersion: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ProjectMember, (pm) => pm.user)
  projectMemberships: ProjectMember[];
}
