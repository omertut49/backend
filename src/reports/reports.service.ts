import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { ReportComment } from './entities/report-comment.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private repo: Repository<Report>,
    @InjectRepository(ReportComment) private commentRepo: Repository<ReportComment>,
  ) {}

  create(dto: CreateReportDto, playerId: string) {
    const report = this.repo.create({ ...dto, playerId } as any);
    return this.repo.save(report);
  }

  findAll(gameId?: string) {
    return this.repo.find({
      where: gameId ? { gameId } : {},
      relations: { player: true, comments: { player: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const report = await this.repo.findOne({
      where: { id },
      relations: { player: true, comments: { player: true } },
    });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    return report;
  }

  async update(id: string, dto: UpdateReportDto) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    const report = await this.repo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    await this.repo.remove(report);
    return { message: 'Rapor silindi' };
  }

  addComment(reportId: string, content: string, playerId: string) {
    const comment = this.commentRepo.create({ reportId, content, playerId });
    return this.commentRepo.save(comment);
  }
}
