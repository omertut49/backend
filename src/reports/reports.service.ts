import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ProjectMembersService } from '../project-members/project-members.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private repo: Repository<Report>,
    private membersService: ProjectMembersService,
  ) {}

  async create(dto: CreateReportDto, playerId: string) {
    await this.membersService.requireMember(dto.gameId, playerId);
    const report = this.repo.create({ ...dto, playerId });
    return this.repo.save(report);
  }

  async findAll(gameId: string | undefined, playerId: string) {
    if (gameId) {
      await this.membersService.requireMember(gameId, playerId);
      return this.repo.find({
        where: { gameId },
        relations: { player: true, resolvedBy: true },
        order: { createdAt: 'DESC' },
      });
    }

    const gameIds = await this.membersService.getMemberGameIds(playerId);
    if (!gameIds.length) return [];

    return this.repo.find({
      where: { gameId: In(gameIds) },
      relations: { player: true, resolvedBy: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, playerId: string) {
    const report = await this.repo.findOne({
      where: { id },
      relations: { player: true, resolvedBy: true },
    });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    await this.membersService.requireMember(report.gameId, playerId);
    return report;
  }

  async update(id: string, dto: UpdateReportDto, playerId: string) {
    const report = await this.repo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    await this.membersService.requireMember(report.gameId, playerId);

    const isAdmin = await this.membersService.isAdmin(report.gameId, playerId);
    if (!isAdmin && report.playerId !== playerId) {
      throw new ForbiddenException('Bu raporu güncelleme yetkiniz yok');
    }

    await this.repo.update(id, dto);
    return this.findOne(id, playerId);
  }

  async remove(id: string, playerId: string) {
    const report = await this.repo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    await this.membersService.requireMember(report.gameId, playerId);

    const isAdmin = await this.membersService.isAdmin(report.gameId, playerId);
    if (!isAdmin && report.playerId !== playerId) {
      throw new ForbiddenException('Bu raporu silme yetkiniz yok');
    }

    await this.repo.remove(report);
    return { message: 'Rapor silindi' };
  }

  async resolve(id: string, resolutionNote: string, playerId: string) {
    const report = await this.repo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    if (report.status !== 'open') {
      throw new BadRequestException('Sadece açık (open) raporlar çözüme gönderilebilir');
    }
    await this.membersService.requireMember(report.gameId, playerId);
    await this.repo.update(id, {
      status: 'pending_approval',
      resolutionNote,
      resolvedById: playerId,
    });
    return this.findOne(id, playerId);
  }

  async approve(id: string, playerId: string) {
    const report = await this.repo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    if (report.status !== 'pending_approval') {
      throw new BadRequestException('Sadece onay bekleyen raporlar onaylanabilir');
    }
    await this.membersService.requireAdmin(report.gameId, playerId);
    await this.repo.update(id, { status: 'resolved' });
    return this.findOne(id, playerId);
  }

  async reject(id: string, playerId: string) {
    const report = await this.repo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    if (report.status !== 'pending_approval') {
      throw new BadRequestException('Sadece onay bekleyen raporlar reddedilebilir');
    }
    await this.membersService.requireAdmin(report.gameId, playerId);
    report.status = 'open';
    report.resolutionNote = null;
    report.resolvedById = null;
    await this.repo.save(report);
    return this.findOne(id, playerId);
  }
}
