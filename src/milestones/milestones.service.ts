import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Milestone } from './entities/milestone.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(Milestone)
    private milestonesRepo: Repository<Milestone>,
    @InjectRepository(Project)
    private projectsRepo: Repository<Project>,
    @InjectRepository(Task)
    private tasksRepo: Repository<Task>,
    @InjectRepository(ProjectMember)
    private membersRepo: Repository<ProjectMember>,
    private eventEmitter: EventEmitter2,
  ) {}

  private async checkAccess(projectId: number, userId: number, role: string) {
    const project = await this.projectsRepo.findOneBy({ id: projectId });
    if (!project) throw new NotFoundException('Proje bulunamadı');

    if (role !== 'admin') {
      const member = await this.membersRepo.findOne({
        where: { project: { id: projectId }, user: { id: userId } },
      });
      if (!member) throw new ForbiddenException('Bu projeye erişim yetkiniz yok');
    }
    return project;
  }

  async create(dto: CreateMilestoneDto, userId: number, role: string): Promise<Milestone> {
    const project = await this.checkAccess(dto.projectId, userId, role);
    const { projectId, ...rest } = dto;
    const milestone = this.milestonesRepo.create({ ...rest, project });
    const saved = await this.milestonesRepo.save(milestone);

    this.eventEmitter.emit('activity.log', {
      action: 'CREATED', entity: 'milestone', entityId: saved.id,
      projectId: dto.projectId, userId, details: { title: saved.title },
    });

    return saved;
  }

  async findByProject(projectId: number, userId: number, role: string): Promise<Milestone[]> {
    await this.checkAccess(projectId, userId, role);
    const milestones = await this.milestonesRepo.find({
      where: { project: { id: projectId } },
      order: { dueDate: 'ASC' },
    });

    // İlerlemeyi hesapla — DB'ye yazma, sadece response objesini güncelle
    await Promise.all(
      milestones.map(async (m) => {
        m.progress = await this.calculateProgress(m.id);
      }),
    );

    return milestones;
  }

  async findOne(id: number, userId: number, role: string): Promise<Milestone> {
    const milestone = await this.milestonesRepo.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!milestone) throw new NotFoundException(`Milestone ${id} bulunamadı`);
    await this.checkAccess(milestone.project.id, userId, role);
    milestone.progress = await this.calculateProgress(id);
    return milestone;
  }

  async update(id: number, dto: UpdateMilestoneDto, userId: number, role: string): Promise<Milestone> {
    const milestone = await this.findOne(id, userId, role);
    await this.milestonesRepo.update(id, dto);

    this.eventEmitter.emit('activity.log', {
      action: 'UPDATED', entity: 'milestone', entityId: id,
      projectId: milestone.project.id, userId, details: { updatedFields: Object.keys(dto) },
    });

    return this.findOne(id, userId, role);
  }

  async remove(id: number, userId: number, role: string): Promise<void> {
    const milestone = await this.findOne(id, userId, role);
    await this.milestonesRepo.softDelete(id);

    this.eventEmitter.emit('activity.log', {
      action: 'DELETED', entity: 'milestone', entityId: id,
      projectId: milestone.project.id, userId, details: {},
    });
  }

  private async calculateProgress(milestoneId: number): Promise<number> {
    const total = await this.tasksRepo.count({
      where: { milestone: { id: milestoneId } },
    });
    if (total === 0) return 0;

    const done = await this.tasksRepo.count({
      where: { milestone: { id: milestoneId }, status: 'done' },
    });

    return Math.round((done / total) * 100);
  }
}
