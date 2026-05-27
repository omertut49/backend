import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Report } from './report.entity';

@Entity('report_comments')
export class ReportComment {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'text' }) content: string;
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => Report, { onDelete: 'CASCADE' }) report: Report;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) author: User | null;
}
