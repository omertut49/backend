import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Game } from '../games/entities/game.entity';
import { Task } from '../tasks/entities/task.entity';
import { Report } from '../reports/entities/report.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(ProjectMember) private memberRepo: Repository<ProjectMember>,
  ) {}

  async getDashboard(playerId: string) {
    const myMemberships = await this.memberRepo.find({
      where: { playerId },
      select: { gameId: true },
    });
    const myGameIds = myMemberships.map((m) => m.gameId);

    const [totalPlayers, myTasks, myCompletedTasks, openReports] = await Promise.all([
      myGameIds.length
        ? this.memberRepo
            .createQueryBuilder('m')
            .select('COUNT(DISTINCT m.playerId)', 'count')
            .where('m.gameId IN (:...gameIds)', { gameIds: myGameIds })
            .getRawOne<{ count: string }>()
            .then((r) => parseInt(r?.count ?? '0', 10))
        : Promise.resolve(0),
      this.taskRepo.count({ where: { assigneeId: playerId } }),
      this.taskRepo.count({ where: { assigneeId: playerId, status: 'done' } }),
      myGameIds.length
        ? this.reportRepo.count({ where: { status: 'open', gameId: In(myGameIds) } })
        : Promise.resolve(0),
    ]);

    const recentTasks = await this.taskRepo.find({
      where: { assigneeId: playerId },
      relations: { game: true, phase: true },
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    return {
      myGames: myGameIds.length,
      totalPlayers,
      myTasks,
      myCompletedTasks,
      openReports,
      recentTasks,
    };
  }
}
