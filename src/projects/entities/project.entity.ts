import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'planning' })
  status: string;

  @Column({ nullable: true })
  deadline: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  owner: User;
}