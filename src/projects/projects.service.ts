import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { UserStarredProject } from './entities/user-starred-project.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private membersRepo: Repository<ProjectMember>,
    @InjectRepository(UserStarredProject)
    private starredRepo: Repository<UserStarredProject>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateProjectDto, ownerId: number): Promise<Project> {
    const owner = await this.usersRepo.findOneBy({ id: ownerId });
    if (!owner) throw new NotFoundException('Kullanıcı bulunamadı');

    const project = this.projectsRepo.create({ ...dto, owner });
    const saved = await this.projectsRepo.save(project);

    // Owner otomatik member olarak eklenir
    const member = this.membersRepo.create({ project: saved, user: owner, role: 'owner' });
    await this.membersRepo.save(member);

    this.eventEmitter.emit('activity.log', {
      action: 'CREATED', entity: 'project', entityId: saved.id,
      userId: ownerId, details: { title: saved.title },
    });

    return this.findOne(saved.id, ownerId, 'admin');
  }

  async findAll(userId: number, role: string): Promise<Project[]> {
    if (role === 'admin') {
      return this.projectsRepo.find({ relations: { owner: true }, order: { createdAt: 'DESC' } });
    }
    // Admin değilse sadece üyesi olduğu projeleri görür
    return this.projectsRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .innerJoin('project.members', 'member')
      .innerJoin('member.user', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number, userId: number, role: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!project) throw new NotFoundException(`Proje ${id} bulunamadı`);

    if (role !== 'admin') {
      const member = await this.membersRepo.findOne({
        where: { project: { id }, user: { id: userId } },
      });
      if (!member) throw new ForbiddenException('Bu projeye erişim yetkiniz yok');
    }

    return project;
  }

  async update(id: number, dto: UpdateProjectDto, userId: number, role: string): Promise<Project> {
    const project = await this.findOne(id, userId, role);

    if (role !== 'admin' && project.owner?.id !== userId) {
      throw new ForbiddenException('Sadece proje sahibi veya admin güncelleyebilir');
    }

    await this.projectsRepo.update(id, dto);

    this.eventEmitter.emit('activity.log', {
      action: 'UPDATED', entity: 'project', entityId: id,
      userId, details: { updatedFields: Object.keys(dto) },
    });

    return this.findOne(id, userId, role);
  }

  async remove(id: number, userId: number, role: string): Promise<void> {
    const project = await this.findOne(id, userId, role);

    if (role !== 'admin' && project.owner?.id !== userId) {
      throw new ForbiddenException('Sadece proje sahibi veya admin silebilir');
    }

    await this.projectsRepo.softDelete(id);

    this.eventEmitter.emit('activity.log', {
      action: 'DELETED', entity: 'project', entityId: id, userId, details: {},
    });
  }

  // Üye yönetimi
  async getMembers(projectId: number, userId: number, role: string) {
    await this.findOne(projectId, userId, role);
    return this.membersRepo.find({
      where: { project: { id: projectId } },
      relations: { user: true },
    });
  }

  async addMember(projectId: number, memberId: number, userId: number, role: string) {
    const project = await this.findOne(projectId, userId, role);

    if (role !== 'admin' && project.owner?.id !== userId) {
      throw new ForbiddenException('Sadece proje sahibi veya admin üye ekleyebilir');
    }

    const user = await this.usersRepo.findOneBy({ id: memberId });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const existing = await this.membersRepo.findOne({
      where: { project: { id: projectId }, user: { id: memberId } },
    });
    if (existing) throw new ConflictException('Kullanıcı zaten bu projenin üyesi');

    const member = this.membersRepo.create({ project, user, role: 'member' });
    const saved = await this.membersRepo.save(member);

    this.eventEmitter.emit('notification.create', {
      userId: memberId,
      message: `${project.title} projesine üye olarak eklendiniz`,
      type: 'PROJECT_MEMBER_ADDED',
      entityId: projectId,
      entityType: 'project',
    });

    this.eventEmitter.emit('activity.log', {
      action: 'ASSIGNED', entity: 'project', entityId: projectId,
      userId, details: { memberId },
    });

    return saved;
  }

  async removeMember(projectId: number, memberId: number, userId: number, role: string) {
    const project = await this.findOne(projectId, userId, role);

    if (role !== 'admin' && project.owner?.id !== userId) {
      throw new ForbiddenException('Sadece proje sahibi veya admin üye çıkarabilir');
    }

    if (project.owner?.id === memberId) {
      throw new ForbiddenException('Proje sahibi çıkarılamaz');
    }

    const member = await this.membersRepo.findOne({
      where: { project: { id: projectId }, user: { id: memberId } },
    });
    if (!member) throw new NotFoundException('Üye bulunamadı');

    await this.membersRepo.remove(member);
  }

  // Yıldızlama
  async toggleStar(projectId: number, userId: number, role: string) {
    await this.findOne(projectId, userId, role);

    const existing = await this.starredRepo.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });

    if (existing) {
      await this.starredRepo.remove(existing);
      return { starred: false };
    }

    const project = await this.projectsRepo.findOneBy({ id: projectId });
    const user = await this.usersRepo.findOneBy({ id: userId });
    const starred = this.starredRepo.create({ project, user });
    await this.starredRepo.save(starred);
    return { starred: true };
  }

  async getStarred(userId: number) {
    const starred = await this.starredRepo.find({
      where: { user: { id: userId } },
      relations: { project: { owner: true } },
    });
    return starred.map((s) => s.project);
  }
}
