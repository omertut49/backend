import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase } from './entities/phase.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMembersService } from '../project-members/project-members.service';

@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase) private repo: Repository<Phase>,
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    private membersService: ProjectMembersService,
  ) {}

  async findAll(gameId: string, playerId: string) {
    await this.membersService.requireMember(gameId, playerId);
    return this.repo.find({ where: { gameId }, order: { order: 'ASC' } });
  }

  async findOne(id: string, playerId: string) {
    const phase = await this.repo.findOne({ where: { id } });
    if (!phase) throw new NotFoundException('Aşama bulunamadı');
    await this.membersService.requireMember(phase.gameId, playerId);
    return phase;
  }

  async findWithProgress(gameId: string, playerId: string) {
    await this.membersService.requireMember(gameId, playerId);
    const phases = await this.repo.find({ where: { gameId }, order: { order: 'ASC' } });
    if (!phases.length) return [];

    // Tüm fazların görev ilerlemesini tek sorguda hesapla (N+1 önler).
    const rows = await this.taskRepo
      .createQueryBuilder('t')
      .select('t.phaseId', 'phaseId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE t.status = 'done')`, 'done')
      .where('t.gameId = :gameId', { gameId })
      .groupBy('t.phaseId')
      .getRawMany<{ phaseId: string; total: string; done: string }>();

    const byPhase = new Map(
      rows.map((r) => [r.phaseId, { total: parseInt(r.total, 10), done: parseInt(r.done, 10) }]),
    );

    return phases.map((phase) => {
      const { total, done } = byPhase.get(phase.id) ?? { total: 0, done: 0 };
      return {
        ...phase,
        progress: {
          total,
          done,
          percentage: total > 0 ? Math.round((done / total) * 100) : 0,
        },
      };
    });
  }
}
