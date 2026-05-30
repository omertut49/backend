import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember, MemberRole } from './entities/project-member.entity';
import { Player } from '../players/entities/player.entity';
import { Game } from '../games/entities/game.entity';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectRepository(ProjectMember) private repo: Repository<ProjectMember>,
    @InjectRepository(Player) private playerRepo: Repository<Player>,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
  ) {}

  async getRole(gameId: string, playerId: string): Promise<MemberRole | null> {
    const member = await this.repo.findOne({ where: { gameId, playerId } });
    return member?.role ?? null;
  }

  async isAdmin(gameId: string, playerId: string): Promise<boolean> {
    return (await this.getRole(gameId, playerId)) === 'admin';
  }

  async isMember(gameId: string, playerId: string): Promise<boolean> {
    return (await this.getRole(gameId, playerId)) !== null;
  }

  async requireAdmin(gameId: string, playerId: string): Promise<void> {
    if (!(await this.isAdmin(gameId, playerId))) {
      throw new ForbiddenException('Bu işlem için proje yöneticisi (ADMIN) yetkisi gereklidir');
    }
  }

  async requireMember(gameId: string, playerId: string): Promise<void> {
    if (!(await this.isMember(gameId, playerId))) {
      throw new ForbiddenException('Bu projeye erişim yetkiniz yok');
    }
  }

  async getMembers(gameId: string, requesterId: string) {
    await this.requireMember(gameId, requesterId);
    return this.repo.find({
      where: { gameId },
      relations: { player: true },
      order: { joinedAt: 'ASC' },
    });
  }

  async getMemberGameIds(playerId: string): Promise<string[]> {
    const members = await this.repo.find({
      where: { playerId },
      select: { gameId: true },
    });
    return members.map((m) => m.gameId);
  }

  async addMember(gameId: string, username: string, role: MemberRole = 'member', requesterId: string) {
    await this.requireAdmin(gameId, requesterId);

    const player = await this.playerRepo.findOne({ where: { username } });
    if (!player) throw new NotFoundException(`"${username}" kullanıcısı bulunamadı`);

    const existing = await this.repo.findOne({ where: { gameId, playerId: player.id } });
    if (existing) throw new ConflictException('Bu kullanıcı zaten projede üye');

    const member = this.repo.create({ gameId, playerId: player.id, role });
    return this.repo.save(member);
  }

  async removeMember(gameId: string, memberId: string, requesterId: string) {
    await this.requireAdmin(gameId, requesterId);

    const member = await this.repo.findOne({
      where: { id: memberId, gameId },
      relations: { game: true },
    });
    if (!member) throw new NotFoundException('Üye bulunamadı');

    if (member.game.ownerId === member.playerId) {
      throw new ForbiddenException('Proje kurucusu projeden çıkarılamaz');
    }

    await this.repo.remove(member);
    return { message: 'Üye projeden çıkarıldı' };
  }

  async updateRole(gameId: string, memberId: string, role: MemberRole, requesterId: string) {
    await this.requireAdmin(gameId, requesterId);

    const member = await this.repo.findOne({
      where: { id: memberId, gameId },
      relations: { game: true },
    });
    if (!member) throw new NotFoundException('Üye bulunamadı');

    if (member.game.ownerId === member.playerId) {
      throw new ForbiddenException('Proje kurucusunun rolü değiştirilemez');
    }

    await this.repo.update(memberId, { role });
    return this.repo.findOne({ where: { id: memberId }, relations: { player: true } });
  }
}
