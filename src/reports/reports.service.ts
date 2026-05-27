import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { ReportComment } from './entities/report-comment.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private reportsRepo: Repository<Report>,
    @InjectRepository(ReportComment) private commentsRepo: Repository<ReportComment>,
    @InjectRepository(ProjectMember) private membersRepo: Repository<ProjectMember>,
  ) {}

  private async getMembership(projectId: number, userId: number) {
    const m = await this.membersRepo.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!m) throw new ForbiddenException('Bu projeye erişim yetkiniz yok');
    return m;
  }

  async findAll(projectId: number, userId: number) {
    await this.getMembership(projectId, userId);
    return this.reportsRepo.find({
      where: { project: { id: projectId } },
      relations: { reporter: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateReportDto, userId: number) {
    await this.getMembership(dto.projectId, userId);
    const report = this.reportsRepo.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: 'open',
      severity: dto.type === 'bug' ? (dto.severity ?? 'medium') : undefined,
      project: { id: dto.projectId },
      reporter: { id: userId },
    });
    return this.reportsRepo.save(report);
  }

  async resolve(id: number, dto: UpdateReportDto, userId: number) {
    const report = await this.reportsRepo.findOne({
      where: { id },
      relations: { project: true, reporter: true },
    });
    if (!report) throw new NotFoundException('Rapor bulunamadı');

    const m = await this.membersRepo.findOne({
      where: { project: { id: report.project.id }, user: { id: userId }, role: 'owner' },
    });
    if (!m) throw new ForbiddenException('Sadece proje yöneticisi raporu çözebilir');

    await this.reportsRepo.update(id, {
      status: 'resolved',
      resolutionNote: dto.resolutionNote,
    });
    return { ...report, status: 'resolved', resolutionNote: dto.resolutionNote };
  }

  async remove(id: number, userId: number) {
    const report = await this.reportsRepo.findOne({
      where: { id },
      relations: { project: true, reporter: true },
    });
    if (!report) throw new NotFoundException('Rapor bulunamadı');

    const m = await this.membersRepo.findOne({
      where: { project: { id: report.project.id }, user: { id: userId } },
    });
    if (!m) throw new ForbiddenException('Erişim yetkiniz yok');

    const isOwner = m.role === 'owner';
    const isReporter = report.reporter?.id === userId;
    if (!isOwner && !isReporter) throw new ForbiddenException('Bu raporu silemezsiniz');

    await this.reportsRepo.delete(id);
    return { message: 'Rapor silindi' };
  }

  // ─── Comments ───────────────────────────────────────────────────────────────

  async getComments(reportId: number, userId: number) {
    const report = await this.reportsRepo.findOne({
      where: { id: reportId },
      relations: { project: true },
    });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    await this.getMembership(report.project.id, userId);
    return this.commentsRepo.find({
      where: { report: { id: reportId } },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
  }

  async addComment(reportId: number, content: string, userId: number) {
    const report = await this.reportsRepo.findOne({
      where: { id: reportId },
      relations: { project: true },
    });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    await this.getMembership(report.project.id, userId);
    const comment = this.commentsRepo.create({
      content,
      report: { id: reportId },
      author: { id: userId },
    });
    return this.commentsRepo.save(comment);
  }

  async deleteComment(commentId: number, userId: number) {
    const comment = await this.commentsRepo.findOne({
      where: { id: commentId },
      relations: { author: true, report: { project: true } },
    });
    if (!comment) throw new NotFoundException('Yorum bulunamadı');

    const m = await this.membersRepo.findOne({
      where: { project: { id: comment.report.project.id }, user: { id: userId } },
    });
    if (!m) throw new ForbiddenException('Erişim yetkiniz yok');

    const isOwner = m.role === 'owner';
    const isAuthor = comment.author?.id === userId;
    if (!isOwner && !isAuthor) throw new ForbiddenException('Bu yorumu silemezsiniz');

    await this.commentsRepo.delete(commentId);
    return { message: 'Yorum silindi' };
  }
}
