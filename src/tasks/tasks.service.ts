import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Milestone } from '../milestones/entities/milestone.entity';
import { Tag } from '../tags/entities/tag.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
    @InjectRepository(Milestone) private milestonesRepo: Repository<Milestone>,
    @InjectRepository(Tag) private tagsRepo: Repository<Tag>,
    @InjectRepository(ProjectMember) private membersRepo: Repository<ProjectMember>,
    private eventEmitter: EventEmitter2,
  ) {}

  private async checkProjectAccess(projectId: number, userId: number, role: string) {
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

  async create(dto: CreateTaskDto, userId: number, role: string): Promise<Task> {
    const project = await this.checkProjectAccess(dto.projectId, userId, role);
    const { projectId, assigneeId, milestoneId, parentTaskId, tagIds, ...rest } = dto;

    const task = this.tasksRepo.create({ ...rest, project });

    if (assigneeId) {
      const assignee = await this.usersRepo.findOneBy({ id: assigneeId });
      if (!assignee) throw new NotFoundException('Kullanıcı bulunamadı');
      task.assignee = assignee;
    }

    if (milestoneId) {
      const milestone = await this.milestonesRepo.findOneBy({ id: milestoneId });
      if (!milestone) throw new NotFoundException('Milestone bulunamadı');
      task.milestone = milestone;
    }

    if (parentTaskId) {
      const parent = await this.tasksRepo.findOneBy({ id: parentTaskId });
      if (!parent) throw new NotFoundException('Üst görev bulunamadı');
      task.parentTask = parent;
    }

    if (tagIds?.length) {
      task.tags = await this.tagsRepo.findBy({ id: In(tagIds) });
    }

    const saved = await this.tasksRepo.save(task);

    if (assigneeId && assigneeId !== userId) {
      this.eventEmitter.emit('notification.create', {
        userId: assigneeId,
        message: `Size "${saved.title}" görevi atandı`,
        type: 'TASK_ASSIGNED',
        entityId: saved.id,
        entityType: 'task',
      });
    }

    this.eventEmitter.emit('activity.log', {
      action: 'CREATED', entity: 'task', entityId: saved.id,
      projectId: dto.projectId, userId, details: { title: saved.title },
    });

    // WebSocket ile gerçek zamanlı güncelleme
    this.eventEmitter.emit('task.updated', { projectId: dto.projectId, task: saved });

    return this.findOne(saved.id, userId, role);
  }

  async findAll(
    filters: { projectId?: number; status?: string; priority?: string; assigneeId?: number; page?: number; limit?: number },
    userId: number,
    role: string,
  ) {
    const { projectId, status, priority, assigneeId, page = 1, limit = 20 } = filters;

    const query = this.tasksRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.milestone', 'milestone')
      .leftJoinAndSelect('task.tags', 'tags')
      .leftJoinAndSelect('task.parentTask', 'parentTask')
      .where('task.deletedAt IS NULL');

    if (role !== 'admin') {
      query
        .innerJoin('project.members', 'member')
        .innerJoin('member.user', 'memberUser')
        .andWhere('memberUser.id = :userId', { userId });
    }

    if (projectId) query.andWhere('project.id = :projectId', { projectId });
    if (status) query.andWhere('task.status = :status', { status });
    if (priority) query.andWhere('task.priority = :priority', { priority });
    if (assigneeId) query.andWhere('assignee.id = :assigneeId', { assigneeId });

    query.orderBy('task.order', 'ASC').addOrderBy('task.createdAt', 'DESC');

    const total = await query.getCount();
    const data = await query.skip((page - 1) * limit).take(limit).getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number, userId: number, role: string): Promise<Task> {
    const task = await this.tasksRepo.findOne({
      where: { id },
      relations: { assignee: true, project: true, milestone: true, tags: true, parentTask: true },
    });
    if (!task) throw new NotFoundException(`Görev ${id} bulunamadı`);
    await this.checkProjectAccess(task.project.id, userId, role);
    return task;
  }

  async update(id: number, dto: UpdateTaskDto, userId: number, role: string): Promise<Task> {
    const task = await this.findOne(id, userId, role);
    const { assigneeId, milestoneId, tagIds, ...rest } = dto;

    const previousAssigneeId = task.assignee?.id;
    const previousStatus = task.status;

    if (rest.status === 'done' && previousStatus !== 'done') {
      (rest as any).completedAt = new Date();
    } else if (rest.status && rest.status !== 'done') {
      (rest as any).completedAt = null;
    }

    await this.tasksRepo.update(id, rest);

    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        task.assignee = null;
      } else {
        const assignee = await this.usersRepo.findOneBy({ id: assigneeId });
        if (!assignee) throw new NotFoundException('Kullanıcı bulunamadı');
        task.assignee = assignee;

        if (assigneeId !== previousAssigneeId && assigneeId !== userId) {
          this.eventEmitter.emit('notification.create', {
            userId: assigneeId,
            message: `Size "${task.title}" görevi atandı`,
            type: 'TASK_ASSIGNED',
            entityId: id,
            entityType: 'task',
          });
        }
      }
    }

    if (milestoneId !== undefined) {
      task.milestone = milestoneId
        ? await this.milestonesRepo.findOneBy({ id: milestoneId })
        : null;
    }

    if (tagIds !== undefined) {
      task.tags = tagIds.length ? await this.tagsRepo.findBy({ id: In(tagIds) }) : [];
    }

    const saved = await this.tasksRepo.save(task);

    this.eventEmitter.emit('activity.log', {
      action: 'UPDATED', entity: 'task', entityId: id,
      projectId: task.project.id, userId, details: { updatedFields: Object.keys(dto) },
    });

    this.eventEmitter.emit('task.updated', { projectId: task.project.id, task: saved });

    return this.findOne(id, userId, role);
  }

  async remove(id: number, userId: number, role: string): Promise<void> {
    const task = await this.findOne(id, userId, role);
    await this.tasksRepo.softDelete(id);

    this.eventEmitter.emit('activity.log', {
      action: 'DELETED', entity: 'task', entityId: id,
      projectId: task.project.id, userId, details: {},
    });

    this.eventEmitter.emit('task.updated', { projectId: task.project.id });
  }

  async bulkUpdate(ids: number[], dto: UpdateTaskDto, userId: number, role: string) {
    const results = await Promise.all(ids.map((id) => this.update(id, dto, userId, role)));
    return results;
  }

  async getCalendar(start: string, end: string, userId: number, role: string) {
    const query = this.tasksRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.project', 'project')
      .where('task.dueDate BETWEEN :start AND :end', { start, end })
      .andWhere('task.deletedAt IS NULL');

    if (role !== 'admin') {
      query
        .innerJoin('project.members', 'member')
        .innerJoin('member.user', 'memberUser')
        .andWhere('memberUser.id = :userId', { userId });
    }

    return query.getMany();
  }
}
