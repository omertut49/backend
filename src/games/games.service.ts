import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Game } from './entities/game.entity';
import { Phase, DEFAULT_PHASES } from '../phases/entities/phase.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { Task } from '../tasks/entities/task.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { ProjectMembersService } from '../project-members/project-members.service';

export interface Progress {
  total: number;
  done: number;
  percentage: number;
}

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game) private repo: Repository<Game>,
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(ProjectMember) private memberRepo: Repository<ProjectMember>,
    private membersService: ProjectMembersService,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateGameDto, ownerId: string) {
    // `phases` Game kolonu değil (görev tohumu); oyun gövdesinden ayır.
    const { phases: phaseSeeds, ...gameData } = dto;

    return this.dataSource.transaction(async (manager) => {
      const game = manager.create(Game, { ...gameData, ownerId });
      const savedGame = await manager.save(game);

      const savedPhases: Record<string, Phase> = {};
      for (const meta of DEFAULT_PHASES) {
        savedPhases[meta.type] = await manager.save(
          Phase,
          manager.create(Phase, { ...meta, gameId: savedGame.id }),
        );
      }

      // Manuel oluşturmada seçilen şablon/özel görevleri ilgili faza ekle.
      for (const seed of phaseSeeds ?? []) {
        const phase = savedPhases[seed.type];
        if (!phase || !seed.tasks?.length) continue;
        const tasks = seed.tasks.map((t) =>
          manager.create(Task, {
            title: t.title,
            description: t.description,
            priority: t.priority ?? 'medium',
            phaseId: phase.id,
            gameId: savedGame.id,
          }),
        );
        await manager.save(Task, tasks);
      }

      const member = manager.create(ProjectMember, {
        gameId: savedGame.id,
        playerId: ownerId,
        role: 'admin',
      });
      await manager.save(ProjectMember, member);

      return savedGame;
    });
  }

  async findAll(playerId: string) {
    const games = await this.repo
      .createQueryBuilder('game')
      .innerJoin('game.members', 'member', 'member.playerId = :playerId', { playerId })
      .leftJoinAndSelect('game.owner', 'owner')
      .orderBy('game.createdAt', 'DESC')
      .getMany();

    if (!games.length) return [];
    const gameIds = games.map((g) => g.id);

    const myMembers = await this.memberRepo.find({
      where: { playerId, gameId: In(gameIds) },
    });
    const roleByGame = new Map(myMembers.map((m) => [m.gameId, m.role]));
    const progressByGame = await this.buildProgressMap(gameIds);

    return games.map((g) => ({
      ...g,
      myRole: roleByGame.get(g.id) ?? null,
      progress: progressByGame.get(g.id) ?? { total: 0, done: 0, percentage: 0 },
    }));
  }

  async findOne(id: string, playerId: string) {
    await this.membersService.requireMember(id, playerId);
    const game = await this.repo.findOne({
      where: { id },
      relations: { owner: true, phases: true, members: { player: true } },
    });
    if (!game) throw new NotFoundException('Proje bulunamadı');
    game.phases?.sort((a, b) => a.order - b.order);

    const myRole = game.members?.find((m) => m.playerId === playerId)?.role ?? null;
    const progress = (await this.buildProgressMap([id])).get(id) ?? {
      total: 0,
      done: 0,
      percentage: 0,
    };

    return { ...game, myRole, progress };
  }

  async update(id: string, dto: UpdateGameDto, playerId: string) {
    const game = await this.repo.findOne({ where: { id } });
    if (!game) throw new NotFoundException('Proje bulunamadı');
    await this.membersService.requireAdmin(id, playerId);
    // `phases` Game kolonu değil (görev tohumu); create() gibi burada da ayıkla.
    const { phases: _phaseSeeds, ...gameData } = dto;
    await this.repo.update(id, gameData);
    return this.findOne(id, playerId);
  }

  async remove(id: string, playerId: string) {
    const game = await this.repo.findOne({ where: { id } });
    if (!game) throw new NotFoundException('Proje bulunamadı');
    if (game.ownerId !== playerId) throw new ForbiddenException('Sadece proje kurucusu silebilir');
    await this.repo.remove(game);
    return { message: 'Proje silindi' };
  }

  /** Birden çok proje için tek sorguda görev ilerlemesini hesaplar (N+1 önler). */
  private async buildProgressMap(gameIds: string[]): Promise<Map<string, Progress>> {
    const rows = await this.taskRepo
      .createQueryBuilder('t')
      .select('t.gameId', 'gameId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE t.status = 'done')`, 'done')
      .where('t.gameId IN (:...gameIds)', { gameIds })
      .groupBy('t.gameId')
      .getRawMany<{ gameId: string; total: string; done: string }>();

    const map = new Map<string, Progress>();
    for (const r of rows) {
      const total = parseInt(r.total, 10);
      const done = parseInt(r.done, 10);
      map.set(r.gameId, { total, done, percentage: total ? Math.round((done / total) * 100) : 0 });
    }
    return map;
  }
}
