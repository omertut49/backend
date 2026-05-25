import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepo: Repository<Tag>,
    @InjectRepository(Project)
    private projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private membersRepo: Repository<ProjectMember>,
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

  async create(dto: CreateTagDto, userId: number, role: string): Promise<Tag> {
    const project = await this.checkAccess(dto.projectId, userId, role);
    const tag = this.tagsRepo.create({ name: dto.name, color: dto.color, project });
    return this.tagsRepo.save(tag);
  }

  async findByProject(projectId: number, userId: number, role: string): Promise<Tag[]> {
    await this.checkAccess(projectId, userId, role);
    return this.tagsRepo.find({
      where: { project: { id: projectId } },
      order: { name: 'ASC' },
    });
  }

  async update(id: number, dto: UpdateTagDto, userId: number, role: string): Promise<Tag> {
    const tag = await this.tagsRepo.findOne({ where: { id }, relations: { project: true } });
    if (!tag) throw new NotFoundException(`Tag ${id} bulunamadı`);
    await this.checkAccess(tag.project.id, userId, role);
    await this.tagsRepo.update(id, dto);
    const updated = await this.tagsRepo.findOne({ where: { id }, relations: { project: true } });
    if (!updated) throw new NotFoundException(`Tag ${id} bulunamadı`);
    return updated;
  }

  async remove(id: number, userId: number, role: string): Promise<void> {
    const tag = await this.tagsRepo.findOne({ where: { id }, relations: { project: true } });
    if (!tag) throw new NotFoundException(`Tag ${id} bulunamadı`);
    await this.checkAccess(tag.project.id, userId, role);
    await this.tagsRepo.delete(id);
  }
}
