import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    @InjectRepository(ProjectMember) private membersRepo: Repository<ProjectMember>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  private async assertOwner(projectId: number, userId: number) {
    const m = await this.membersRepo.findOne({
      where: { project: { id: projectId }, user: { id: userId }, role: 'owner' },
    });
    if (!m) throw new ForbiddenException('Bu işlem için proje yöneticisi olmanız gerekiyor');
  }

  private async assertMember(projectId: number, userId: number) {
    const m = await this.membersRepo.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!m) throw new ForbiddenException('Bu projeye erişim yetkiniz yok');
  }

  async findAll(projectId: number, userId: number) {
    await this.assertMember(projectId, userId);
    return this.tasksRepo.find({
      where: { project: { id: projectId } },
      relations: { assignee: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateTaskDto, userId: number) {
    await this.assertOwner(dto.projectId, userId);

    let assignee: User | null = null;
    if (dto.assigneeId) {
      assignee = await this.usersRepo.findOneBy({ id: dto.assigneeId });
      if (!assignee) throw new NotFoundException('Atanacak kullanıcı bulunamadı');
    }

    const task = this.tasksRepo.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority ?? 'medium',
      status: 'todo',
      project: { id: dto.projectId },
      assignee,
    });
    return this.tasksRepo.save(task);
  }

  async update(id: number, dto: UpdateTaskDto, userId: number) {
    const task = await this.tasksRepo.findOne({
      where: { id },
      relations: { project: true, assignee: true },
    });
    if (!task) throw new NotFoundException('Görev bulunamadı');
    await this.assertOwner(task.project.id, userId);

    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId === null) {
        task.assignee = null;
      } else {
        const user = await this.usersRepo.findOneBy({ id: dto.assigneeId });
        if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
        task.assignee = user;
      }
    }

    const { assigneeId, ...rest } = dto;
    Object.assign(task, rest);
    return this.tasksRepo.save(task);
  }

  // Atanan kişi (veya admin) görevi tamamlar ve not bırakır
  async complete(id: number, userId: number, note?: string) {
    const task = await this.tasksRepo.findOne({
      where: { id },
      relations: { project: true, assignee: true },
    });
    if (!task) throw new NotFoundException('Görev bulunamadı');

    const isOwner = await this.membersRepo.findOne({
      where: { project: { id: task.project.id }, user: { id: userId }, role: 'owner' },
    });
    const isAssignee = task.assignee?.id === userId;

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('Bu görevi sadece atanan kişi veya yönetici tamamlayabilir');
    }

    task.status = 'done';
    task.completionNote = note ?? null;
    return this.tasksRepo.save(task);
  }

  async remove(id: number, userId: number) {
    const task = await this.tasksRepo.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!task) throw new NotFoundException('Görev bulunamadı');
    await this.assertOwner(task.project.id, userId);
    await this.tasksRepo.delete(id);
    return { message: 'Görev silindi' };
  }
}
