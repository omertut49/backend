import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember) private membersRepo: Repository<ProjectMember>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateProjectDto, ownerId: number) {
    const owner = await this.usersRepo.findOneBy({ id: ownerId });
    if (!owner) throw new NotFoundException('Kullanıcı bulunamadı');

    const project = await this.projectsRepo.save(
      this.projectsRepo.create({ ...dto, owner }),
    );
    await this.membersRepo.save(
      this.membersRepo.create({ project, user: owner, role: 'owner' }),
    );
    return this.findOne(project.id, ownerId);
  }

  async findAll(userId: number) {
    return this.projectsRepo
      .createQueryBuilder('project')
      .innerJoin('project.members', 'pm', 'pm.user.id = :userId', { userId })
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .leftJoinAndSelect('project.owner', 'owner')
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number, userId: number) {
    const project = await this.projectsRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('project.id = :id', { id })
      .getOne();
    if (!project) throw new NotFoundException('Proje bulunamadı');
    const isMember = project.members.some((m) => m.user?.id === userId);
    if (!isMember) throw new ForbiddenException('Bu projeye erişim yetkiniz yok');
    return project;
  }

  async update(id: number, dto: UpdateProjectDto, userId: number) {
    const project = await this.findOne(id, userId);
    await this.assertOwner(project, userId);
    await this.projectsRepo.update(id, dto);
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    const project = await this.findOne(id, userId);
    await this.assertOwner(project, userId);
    await this.projectsRepo.delete(id);
    return { message: 'Proje silindi' };
  }

  async getMembers(id: number, userId: number) {
    await this.findOne(id, userId);
    return this.membersRepo.find({
      where: { project: { id } },
      relations: { user: true },
      order: { joinedAt: 'ASC' },
    });
  }

  async addMember(id: number, newUserId: number, userId: number) {
    const project = await this.findOne(id, userId);
    await this.assertOwner(project, userId);

    const newUser = await this.usersRepo.findOneBy({ id: newUserId });
    if (!newUser) throw new NotFoundException('Kullanıcı bulunamadı');

    const existing = await this.membersRepo.findOne({
      where: { project: { id }, user: { id: newUserId } },
    });
    if (existing) throw new ConflictException('Bu kullanıcı zaten üye');

    return this.membersRepo.save(
      this.membersRepo.create({ project: { id }, user: newUser, role: 'member' }),
    );
  }

  async removeMember(id: number, memberId: number, userId: number) {
    const project = await this.findOne(id, userId);
    await this.assertOwner(project, userId);

    const member = await this.membersRepo.findOne({
      where: { id: memberId, project: { id } },
      relations: { user: true },
    });
    if (!member) throw new NotFoundException('Üye bulunamadı');
    if (member.user?.id === userId) throw new ForbiddenException('Kendinizi projeden çıkaramazsınız');

    await this.membersRepo.delete(memberId);
    return { message: 'Üye çıkarıldı' };
  }

  private async assertOwner(project: Project, userId: number) {
    const ownerMember = await this.membersRepo.findOne({
      where: { project: { id: project.id }, user: { id: userId }, role: 'owner' },
    });
    if (!ownerMember) throw new ForbiddenException('Bu işlem için proje yöneticisi olmanız gerekiyor');
  }
}
