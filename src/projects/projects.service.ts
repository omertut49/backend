import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    const { ownerId, ...rest } = dto;
    const project = this.projectsRepository.create(rest);

    if (ownerId) {
      const owner = await this.usersRepository.findOneBy({ id: ownerId });
      if (!owner) throw new NotFoundException(`Kullanıcı ${ownerId} bulunamadı`);
      project.owner = owner;
    }

    return this.projectsRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find({ relations: ['owner'] });
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!project) throw new NotFoundException(`Proje ${id} bulunamadı`);
    return project;
  }

  async update(id: number, dto: UpdateProjectDto, requesterId: number): Promise<Project> {
    const project = await this.findOne(id);
    if (project.owner && project.owner.id !== requesterId) {
      throw new ForbiddenException('Bu projeyi sadece sahibi güncelleyebilir');
    }

    const { ownerId, ...rest } = dto;
    await this.projectsRepository.update(id, rest);

    if (ownerId !== undefined) {
      const owner = await this.usersRepository.findOneBy({ id: ownerId });
      if (!owner) throw new NotFoundException(`Kullanıcı ${ownerId} bulunamadı`);
      project.owner = owner;
      await this.projectsRepository.save(project);
    }

    return this.findOne(id);
  }

  async remove(id: number, requesterId: number): Promise<void> {
    const project = await this.findOne(id);
    if (project.owner && project.owner.id !== requesterId) {
      throw new ForbiddenException('Bu projeyi sadece sahibi silebilir');
    }
    await this.projectsRepository.delete(id);
  }
}
