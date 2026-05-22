import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const { assigneeId, projectId, ...rest } = dto;
    const task = this.tasksRepository.create(rest);

    if (assigneeId) {
      const assignee = await this.usersRepository.findOneBy({ id: assigneeId });
      if (!assignee) throw new NotFoundException(`Kullanıcı ${assigneeId} bulunamadı`);
      task.assignee = assignee;
    }

    if (projectId) {
      const project = await this.projectsRepository.findOneBy({ id: projectId });
      if (!project) throw new NotFoundException(`Proje ${projectId} bulunamadı`);
      task.project = project;
    }

    return this.tasksRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({ relations: ['assignee', 'project'] });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'project'],
    });
    if (!task) throw new NotFoundException(`Görev ${id} bulunamadı`);
    return task;
  }

  async update(id: number, dto: UpdateTaskDto, requesterId: number): Promise<Task> {
    const task = await this.findOne(id);
    if (task.assignee && task.assignee.id !== requesterId) {
      throw new ForbiddenException('Bu görevi sadece atanan kişi güncelleyebilir');
    }

    const { assigneeId, projectId, ...rest } = dto;
    await this.tasksRepository.update(id, rest);

    if (assigneeId !== undefined) {
      const assignee = await this.usersRepository.findOneBy({ id: assigneeId });
      if (!assignee) throw new NotFoundException(`Kullanıcı ${assigneeId} bulunamadı`);
      task.assignee = assignee;
    }

    if (projectId !== undefined) {
      const project = await this.projectsRepository.findOneBy({ id: projectId });
      if (!project) throw new NotFoundException(`Proje ${projectId} bulunamadı`);
      task.project = project;
    }

    return this.tasksRepository.save(task);
  }

  async remove(id: number, requesterId: number): Promise<void> {
    const task = await this.findOne(id);
    if (task.assignee && task.assignee.id !== requesterId) {
      throw new ForbiddenException('Bu görevi sadece atanan kişi silebilir');
    }
    await this.tasksRepository.delete(id);
  }
}
