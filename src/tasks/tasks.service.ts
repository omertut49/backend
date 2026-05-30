import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectMembersService } from '../project-members/project-members.service';
import { Phase } from '../phases/entities/phase.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    @InjectRepository(Phase) private phaseRepo: Repository<Phase>,
    private membersService: ProjectMembersService,
  ) {}

  async create(dto: CreateTaskDto, playerId: string) {
    await this.membersService.requireAdmin(dto.gameId, playerId);
    const task = this.repo.create(dto);
    return this.repo.save(task);
  }

  async findAll(
    gameId: string | undefined,
    phaseId: string | undefined,
    assigneeId: string | undefined,
    playerId: string,
  ) {
    let resolvedGameId = gameId;

    if (phaseId) {
      const phase = await this.phaseRepo.findOne({ where: { id: phaseId } });
      if (!phase) throw new NotFoundException('Aşama bulunamadı');
      if (resolvedGameId && resolvedGameId !== phase.gameId) {
        throw new BadRequestException('gameId ve phaseId aynı projeye ait olmalı');
      }
      resolvedGameId = phase.gameId;
    }

    if (resolvedGameId) {
      await this.membersService.requireMember(resolvedGameId, playerId);
      const where: Partial<Task> = { gameId: resolvedGameId };
      if (phaseId) where.phaseId = phaseId;
      if (assigneeId) where.assigneeId = assigneeId;
      return this.repo.find({
        where,
        relations: { assignee: true, phase: true, game: true },
        order: { createdAt: 'DESC' },
      });
    }

    if (assigneeId) {
      if (assigneeId !== playerId) {
        throw new ForbiddenException('Başka kullanıcıların görevlerini listeleyemezsiniz');
      }
      return this.repo.find({
        where: { assigneeId },
        relations: { assignee: true, phase: true, game: true },
        order: { createdAt: 'DESC' },
      });
    }

    const memberships = await this.membersService.getMemberGameIds(playerId);
    if (!memberships.length) return [];

    return this.repo.find({
      where: { gameId: In(memberships) },
      relations: { assignee: true, phase: true, game: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, playerId: string) {
    const task = await this.repo.findOne({
      where: { id },
      relations: { assignee: true, phase: true, game: true },
    });
    if (!task) throw new NotFoundException('Görev bulunamadı');
    await this.membersService.requireMember(task.gameId, playerId);
    return task;
  }

  findMine(playerId: string) {
    return this.repo.find({
      where: { assigneeId: playerId },
      relations: { phase: true, game: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateTaskDto, playerId: string) {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Görev bulunamadı');

    const isAdmin = await this.membersService.isAdmin(task.gameId, playerId);
    const isAssignee = task.assigneeId === playerId;

    if (!isAdmin) {
      if (!isAssignee) throw new ForbiddenException('Bu görevi güncelleme yetkiniz yok');
      const patch: Partial<Task> = {};
      if (dto.status !== undefined) patch.status = dto.status;
      if (dto.completionNote !== undefined) patch.completionNote = dto.completionNote;
      if (Object.keys(patch).length > 0) await this.repo.update(id, patch);
    } else {
      await this.repo.update(id, dto);
    }

    return this.findOne(id, playerId);
  }

  async remove(id: string, playerId: string) {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Görev bulunamadı');
    await this.membersService.requireAdmin(task.gameId, playerId);
    await this.repo.remove(task);
    return { message: 'Görev silindi' };
  }

  async getProgress(gameId: string, playerId: string) {
    await this.membersService.requireMember(gameId, playerId);
    const tasks = await this.repo.find({ where: { gameId } });
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    return { total, done, percentage: total > 0 ? Math.round((done / total) * 100) : 0 };
  }
}
