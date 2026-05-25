import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Task } from '../tasks/entities/task.entity';
import { BugReport } from '../bug-reports/entities/bug-report.entity';
import { Milestone } from '../milestones/entities/milestone.entity';
import { ActivityLog } from '../activity-log/entities/activity-log.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Project)
    private projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private membersRepo: Repository<ProjectMember>,
    @InjectRepository(Task)
    private tasksRepo: Repository<Task>,
    @InjectRepository(BugReport)
    private bugsRepo: Repository<BugReport>,
    @InjectRepository(Milestone)
    private milestonesRepo: Repository<Milestone>,
    @InjectRepository(ActivityLog)
    private logsRepo: Repository<ActivityLog>,
  ) {}

  async getGlobalStats(userId: number, role: string) {
    const isAdmin = role === 'admin';

    // Proje erişim filtresi (admin hepsini görür)
    const accessibleProjectIds = isAdmin
      ? null
      : await this.getAccessibleProjectIds(userId);

    const [
      totalProjects,
      totalTasks,
      totalBugs,
      totalUsers,
      tasksByStatus,
      bugsBySeverity,
      bugsByStatus,
      recentActivity,
      taskCompletionByDay,
    ] = await Promise.all([
      this.countProjects(accessibleProjectIds),
      this.countTasks(accessibleProjectIds),
      this.countBugs(accessibleProjectIds),
      isAdmin ? this.usersRepo.count() : Promise.resolve(null),
      this.getTasksByStatus(accessibleProjectIds),
      this.getBugsBySeverity(accessibleProjectIds),
      this.getBugsByStatus(accessibleProjectIds),
      this.getRecentActivity(isAdmin ? null : userId),
      this.getTaskCompletionByDay(accessibleProjectIds),
    ]);

    return {
      overview: {
        totalProjects,
        totalTasks,
        totalBugs,
        ...(isAdmin && { totalUsers }),
      },
      tasksByStatus,
      bugsBySeverity,
      bugsByStatus,
      recentActivity,
      taskCompletionByDay,
    };
  }

  async getProjectStats(projectId: number, userId: number, role: string) {
    if (role !== 'admin') {
      const member = await this.membersRepo.findOne({
        where: { project: { id: projectId }, user: { id: userId } },
      });
      if (!member) throw new ForbiddenException('Bu projeye erişim yetkiniz yok');
    }
    const [
      tasksByStatus,
      bugsBySeverity,
      milestones,
      memberCount,
      recentActivity,
    ] = await Promise.all([
      this.getTasksByStatus([projectId]),
      this.getBugsBySeverity([projectId]),
      this.milestonesRepo.find({
        where: { project: { id: projectId } },
        select: { id: true, title: true, status: true, progress: true, dueDate: true },
      }),
      this.membersRepo.count({ where: { project: { id: projectId } } }),
      this.getRecentActivity(null, projectId),
    ]);

    return { tasksByStatus, bugsBySeverity, milestones, memberCount, recentActivity };
  }

  private async getAccessibleProjectIds(userId: number): Promise<number[]> {
    const members = await this.membersRepo.find({
      where: { user: { id: userId } },
      relations: { project: true },
    });
    return members.map((m) => m.project.id);
  }

  private async countProjects(ids: number[] | null) {
    if (ids !== null && ids.length === 0) return 0;
    const qb = this.projectsRepo.createQueryBuilder('p');
    if (ids) qb.where('p.id IN (:...ids)', { ids });
    return qb.getCount();
  }

  private async countTasks(ids: number[] | null) {
    if (ids !== null && ids.length === 0) return 0;
    const qb = this.tasksRepo.createQueryBuilder('t').leftJoin('t.project', 'p');
    if (ids) qb.where('p.id IN (:...ids)', { ids });
    return qb.getCount();
  }

  private async countBugs(ids: number[] | null) {
    if (ids !== null && ids.length === 0) return 0;
    const qb = this.bugsRepo.createQueryBuilder('b').leftJoin('b.project', 'p');
    if (ids) qb.where('p.id IN (:...ids)', { ids });
    return qb.getCount();
  }

  private async getTasksByStatus(ids: number[] | null) {
    if (ids !== null && ids.length === 0) {
      return { todo: 0, in_progress: 0, done: 0 };
    }

    const qb = this.tasksRepo
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('t.project', 'p')
      .groupBy('t.status');

    if (ids) qb.where('p.id IN (:...ids)', { ids });

    const rows = await qb.getRawMany();
    const result: Record<string, number> = { todo: 0, in_progress: 0, done: 0 };
    for (const row of rows) result[row.status] = parseInt(row.count, 10);
    return result;
  }

  private async getBugsBySeverity(ids: number[] | null) {
    if (ids !== null && ids.length === 0) {
      return { low: 0, medium: 0, high: 0, critical: 0 };
    }

    const qb = this.bugsRepo
      .createQueryBuilder('b')
      .select('b.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('b.project', 'p')
      .groupBy('b.severity');

    if (ids) qb.where('p.id IN (:...ids)', { ids });

    const rows = await qb.getRawMany();
    const result: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const row of rows) result[row.severity] = parseInt(row.count, 10);
    return result;
  }

  private async getBugsByStatus(ids: number[] | null) {
    if (ids !== null && ids.length === 0) {
      return { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    }

    const qb = this.bugsRepo
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('b.project', 'p')
      .groupBy('b.status');

    if (ids) qb.where('p.id IN (:...ids)', { ids });

    const rows = await qb.getRawMany();
    const result: Record<string, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    for (const row of rows) result[row.status] = parseInt(row.count, 10);
    return result;
  }

  private async getRecentActivity(userId: number | null, projectId?: number) {
    const qb = this.logsRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .take(10);

    if (userId !== null) qb.where('user.id = :userId', { userId });
    if (projectId) qb.andWhere('log.projectId = :projectId', { projectId });

    return qb.getMany();
  }

  // Son 7 günde tamamlanan task sayısı (Gantt/chart için)
  private async getTaskCompletionByDay(ids: number[] | null) {
    if (ids !== null && ids.length === 0) return [];

    const qb = this.tasksRepo
      .createQueryBuilder('t')
      .select("DATE(t.completedAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('t.project', 'p')
      .where('t.completedAt IS NOT NULL')
      .andWhere("t.completedAt >= NOW() - INTERVAL '7 days'")
      .groupBy("DATE(t.completedAt)")
      .orderBy('date', 'ASC');

    if (ids) qb.andWhere('p.id IN (:...ids)', { ids });

    return qb.getRawMany();
  }
}
