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

    return Promise.all(
      phases.map(async (phase) => {
        const tasks = await this.taskRepo.find({ where: { phaseId: phase.id } });
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === 'done').length;
        return {
          ...phase,
          progress: {
            total,
            done,
            percentage: total > 0 ? Math.round((done / total) * 100) : 0,
          },
        };
      }),
    );
  }
}
