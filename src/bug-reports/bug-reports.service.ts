import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BugReport } from './entities/bug-report.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { UpdateBugReportDto } from './dto/update-bug-report.dto';

@Injectable()
export class BugReportsService {
  constructor(
    @InjectRepository(BugReport)
    private bugReportsRepository: Repository<BugReport>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(dto: CreateBugReportDto): Promise<BugReport> {
    const { reporterId, projectId, ...rest } = dto;
    const bug = this.bugReportsRepository.create(rest);

    if (reporterId) {
      const reporter = await this.usersRepository.findOneBy({ id: reporterId });
      if (!reporter) throw new NotFoundException(`Kullanıcı ${reporterId} bulunamadı`);
      bug.reporter = reporter;
    }

    if (projectId) {
      const project = await this.projectsRepository.findOneBy({ id: projectId });
      if (!project) throw new NotFoundException(`Proje ${projectId} bulunamadı`);
      bug.project = project;
    }

    return this.bugReportsRepository.save(bug);
  }

  async findAll(): Promise<BugReport[]> {
    return this.bugReportsRepository.find({ relations: ['reporter', 'project'] });
  }

  async findOne(id: number): Promise<BugReport> {
    const bug = await this.bugReportsRepository.findOne({
      where: { id },
      relations: ['reporter', 'project'],
    });
    if (!bug) throw new NotFoundException(`Bug ${id} bulunamadı`);
    return bug;
  }

  async update(id: number, dto: UpdateBugReportDto, requesterId: number): Promise<BugReport> {
    const bug = await this.findOne(id);
    if (bug.reporter && bug.reporter.id !== requesterId) {
      throw new ForbiddenException('Bu bug raporunu sadece raporlayan güncelleyebilir');
    }

    const { reporterId, projectId, ...rest } = dto;
    await this.bugReportsRepository.update(id, rest);

    if (reporterId !== undefined) {
      const reporter = await this.usersRepository.findOneBy({ id: reporterId });
      if (!reporter) throw new NotFoundException(`Kullanıcı ${reporterId} bulunamadı`);
      bug.reporter = reporter;
    }

    if (projectId !== undefined) {
      const project = await this.projectsRepository.findOneBy({ id: projectId });
      if (!project) throw new NotFoundException(`Proje ${projectId} bulunamadı`);
      bug.project = project;
    }

    return this.bugReportsRepository.save(bug);
  }

  async remove(id: number, requesterId: number): Promise<void> {
    const bug = await this.findOne(id);
    if (bug.reporter && bug.reporter.id !== requesterId) {
      throw new ForbiddenException('Bu bug raporunu sadece raporlayan silebilir');
    }
    await this.bugReportsRepository.delete(id);
  }
}
