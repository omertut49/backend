import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BugReport } from './entities/bug-report.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { Tag } from '../tags/entities/tag.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { UpdateBugReportDto } from './dto/update-bug-report.dto';

@Injectable()
export class BugReportsService {
  constructor(
    @InjectRepository(BugReport) private bugsRepo: Repository<BugReport>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    @InjectRepository(Tag) private tagsRepo: Repository<Tag>,
    @InjectRepository(ProjectMember) private membersRepo: Repository<ProjectMember>,
    private eventEmitter: EventEmitter2,
  ) {}

  private async checkProjectAccess(projectId: number, userId: number) {
    const project = await this.projectsRepo.findOneBy({ id: projectId });
    if (!project) throw new NotFoundException('Proje bulunamadı');
    const member = await this.membersRepo.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!member) throw new ForbiddenException('Bu projeye erişim yetkiniz yok');
    return project;
  }

  private async isProjectOwner(projectId: number, userId: number): Promise<boolean> {
    const member = await this.membersRepo.findOne({
      where: { project: { id: projectId }, user: { id: userId }, role: 'owner' },
    });
    return !!member;
  }

  async create(dto: CreateBugReportDto, userId: number, role: string): Promise<BugReport> {
    const project = await this.checkProjectAccess(dto.projectId, userId);
    const reporter = await this.usersRepo.findOneBy({ id: userId });
    const { projectId, assigneeId, linkedTaskId, tagIds, ...rest } = dto;

    const bug = this.bugsRepo.create({ ...rest, project, reporter });

    if (assigneeId) {
      const assignee = await this.usersRepo.findOneBy({ id: assigneeId });
      if (!assignee) throw new NotFoundException('Kullanıcı bulunamadı');
      bug.assignee = assignee;
    }

    if (linkedTaskId) {
      const task = await this.tasksRepo.findOneBy({ id: linkedTaskId });
      if (!task) throw new NotFoundException('Görev bulunamadı');
      bug.linkedTask = task;
    }

    if (tagIds?.length) {
      bug.tags = await this.tagsRepo.findBy({ id: In(tagIds) });
    }

    const saved = await this.bugsRepo.save(bug);

    // Proje üyelerine bildirim gönder
    const members = await this.membersRepo.find({
      where: { project: { id: dto.projectId } },
      relations: { user: true },
    });

    members.forEach((member) => {
      if (member.user.id !== userId) {
        this.eventEmitter.emit('notification.create', {
          userId: member.user.id,
          message: `"${project.title}" projesinde yeni bug raporu: "${saved.title}"`,
          type: 'BUG_REPORTED',
          entityId: saved.id,
          entityType: 'bug',
        });
      }
    });

    this.eventEmitter.emit('activity.log', {
      action: 'CREATED', entity: 'bug', entityId: saved.id,
      projectId: dto.projectId, userId, details: { title: saved.title, severity: saved.severity },
    });

    return this.findOne(saved.id, userId, role);
  }

  async findAll(
    filters: { projectId?: number; status?: string; severity?: string; assigneeId?: number; page?: number; limit?: number },
    userId: number,
    role: string,
  ) {
    const { projectId, status, severity, assigneeId, page = 1, limit = 20 } = filters;

    const query = this.bugsRepo
      .createQueryBuilder('bug')
      .leftJoinAndSelect('bug.reporter', 'reporter')
      .leftJoinAndSelect('bug.assignee', 'assignee')
      .leftJoinAndSelect('bug.project', 'project')
      .leftJoinAndSelect('bug.linkedTask', 'linkedTask')
      .leftJoinAndSelect('bug.tags', 'tags')
      .where('bug.deletedAt IS NULL');

    query
      .innerJoin('project.members', 'member')
      .innerJoin('member.user', 'memberUser')
      .andWhere('memberUser.id = :userId', { userId });

    if (projectId) query.andWhere('project.id = :projectId', { projectId });
    if (status) query.andWhere('bug.status = :status', { status });
    if (severity) query.andWhere('bug.severity = :severity', { severity });
    if (assigneeId) query.andWhere('assignee.id = :assigneeId', { assigneeId });

    query.orderBy('bug.createdAt', 'DESC');

    const total = await query.getCount();
    const data = await query.skip((page - 1) * limit).take(limit).getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number, userId: number, role: string): Promise<BugReport> {
    const bug = await this.bugsRepo.findOne({
      where: { id },
      relations: { reporter: true, assignee: true, project: true, linkedTask: true, tags: true },
    });
    if (!bug) throw new NotFoundException(`Bug ${id} bulunamadı`);
    await this.checkProjectAccess(bug.project.id, userId);
    return bug;
  }

  async update(id: number, dto: UpdateBugReportDto, userId: number, role: string): Promise<BugReport> {
    const bug = await this.findOne(id, userId, role);
    const { assigneeId, linkedTaskId, tagIds, ...rest } = dto;

    const previousStatus = bug.status;

    if (rest.status === 'resolved' && previousStatus !== 'resolved') {
      (rest as any).resolvedAt = new Date();

      // Reporter'a bildirim gönder
      if (bug.reporter && bug.reporter.id !== userId) {
        this.eventEmitter.emit('notification.create', {
          userId: bug.reporter.id,
          message: `Raporladığınız "${bug.title}" bug'ı çözüldü`,
          type: 'BUG_RESOLVED',
          entityId: id,
          entityType: 'bug',
        });
      }
    }

    await this.bugsRepo.update(id, rest);

    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        bug.assignee = null;
      } else {
        const assignee = await this.usersRepo.findOneBy({ id: assigneeId });
        if (!assignee) throw new NotFoundException('Kullanıcı bulunamadı');
        bug.assignee = assignee;
      }
    }

    if (linkedTaskId !== undefined) {
      bug.linkedTask = linkedTaskId
        ? await this.tasksRepo.findOneBy({ id: linkedTaskId })
        : null;
    }

    if (tagIds !== undefined) {
      bug.tags = tagIds.length ? await this.tagsRepo.findBy({ id: In(tagIds) }) : [];
    }

    await this.bugsRepo.save(bug);

    this.eventEmitter.emit('activity.log', {
      action: 'UPDATED', entity: 'bug', entityId: id,
      projectId: bug.project.id, userId, details: { updatedFields: Object.keys(dto) },
    });

    return this.findOne(id, userId, role);
  }

  async remove(id: number, userId: number, role: string): Promise<void> {
    const bug = await this.findOne(id, userId, role);

    const owner = await this.isProjectOwner(bug.project.id, userId);
    if (!owner && bug.reporter?.id !== userId) {
      throw new ForbiddenException('Sadece raporlayan veya proje sahibi silebilir');
    }

    await this.bugsRepo.softDelete(id);

    this.eventEmitter.emit('activity.log', {
      action: 'DELETED', entity: 'bug', entityId: id,
      projectId: bug.project.id, userId, details: {},
    });
  }

  async bulkUpdate(ids: number[], dto: UpdateBugReportDto, userId: number, role: string) {
    return Promise.all(ids.map((id) => this.update(id, dto, userId, role)));
  }
}
