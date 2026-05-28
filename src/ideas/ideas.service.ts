import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdeaSession } from './entities/idea-session.entity';
import { GameIdea } from './entities/game-idea.entity';
import { Mechanic } from './entities/mechanic.entity';
import { User } from '../users/entities/user.entity';
import { GeminiService } from './gemini.service';

@Injectable()
export class IdeasService {
  constructor(
    @InjectRepository(IdeaSession) private sessionsRepo: Repository<IdeaSession>,
    @InjectRepository(GameIdea) private ideasRepo: Repository<GameIdea>,
    @InjectRepository(Mechanic) private mechanicsRepo: Repository<Mechanic>,
    private geminiService: GeminiService,
  ) {}

  findAll() {
    return this.sessionsRepo.find({
      relations: { creator: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(sessionId: number, userId: number) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
      relations: { creator: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı');

    const rawIdeas = await this.ideasRepo.find({
      where: { session: { id: sessionId } },
      relations: { proposer: true, voters: true, mechanics: { proposer: true, voters: true } },
      order: { createdAt: 'ASC' },
    });

    const ideas = rawIdeas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      proposer: idea.proposer,
      voteCount: idea.voters.length,
      hasVoted: idea.voters.some((v) => v.id === userId),
      createdAt: idea.createdAt,
      mechanics: (idea.mechanics ?? []).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        proposer: m.proposer,
        voteCount: m.voters.length,
        hasVoted: m.voters.some((v) => v.id === userId),
        createdAt: m.createdAt,
      })),
    }));

    return { ...session, ideas };
  }

  async create(title: string, description: string | undefined, userId: number) {
    const session = this.sessionsRepo.create({
      title,
      description: description ?? null,
      status: 'open',
      creator: { id: userId } as User,
    });
    return this.sessionsRepo.save(session);
  }

  async remove(sessionId: number, userId: number) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
      relations: { creator: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı');
    if (session.creator?.id !== userId) throw new ForbiddenException('Sadece oluşturan kişi silebilir');
    await this.sessionsRepo.delete(sessionId);
    return { message: 'Oturum silindi' };
  }

  async addIdea(sessionId: number, title: string, description: string | undefined, userId: number) {
    const session = await this.sessionsRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Oturum bulunamadı');
    const idea = this.ideasRepo.create({
      title,
      description: description ?? null,
      session: { id: sessionId } as IdeaSession,
      proposer: { id: userId } as User,
      voters: [],
    });
    return this.ideasRepo.save(idea);
  }

  async removeIdea(ideaId: number, userId: number) {
    const idea = await this.ideasRepo.findOne({
      where: { id: ideaId },
      relations: { proposer: true, session: { creator: true } },
    });
    if (!idea) throw new NotFoundException('Fikir bulunamadı');
    const isCreator = idea.session?.creator?.id === userId;
    const isProposer = idea.proposer?.id === userId;
    if (!isCreator && !isProposer) throw new ForbiddenException('Bu fikri silemezsiniz');
    await this.ideasRepo.delete(ideaId);
    return { message: 'Fikir silindi' };
  }

  async toggleIdeaVote(ideaId: number, userId: number) {
    const idea = await this.ideasRepo.findOne({
      where: { id: ideaId },
      relations: { voters: true },
    });
    if (!idea) throw new NotFoundException('Fikir bulunamadı');
    const idx = idea.voters.findIndex((v) => v.id === userId);
    if (idx >= 0) {
      idea.voters.splice(idx, 1);
    } else {
      idea.voters.push({ id: userId } as User);
    }
    await this.ideasRepo.save(idea);
    return { voteCount: idea.voters.length, hasVoted: idx < 0 };
  }

  async addMechanic(ideaId: number, title: string, description: string | undefined, userId: number) {
    const idea = await this.ideasRepo.findOneBy({ id: ideaId });
    if (!idea) throw new NotFoundException('Fikir bulunamadı');
    const mechanic = this.mechanicsRepo.create({
      title,
      description: description ?? null,
      idea: { id: ideaId } as GameIdea,
      proposer: { id: userId } as User,
      voters: [],
    });
    return this.mechanicsRepo.save(mechanic);
  }

  async removeMechanic(mechanicId: number, userId: number) {
    const mechanic = await this.mechanicsRepo.findOne({
      where: { id: mechanicId },
      relations: { proposer: true, idea: { session: { creator: true } } },
    });
    if (!mechanic) throw new NotFoundException('Mekanik bulunamadı');
    const isCreator = mechanic.idea?.session?.creator?.id === userId;
    const isProposer = mechanic.proposer?.id === userId;
    if (!isCreator && !isProposer) throw new ForbiddenException('Bu mekaniği silemezsiniz');
    await this.mechanicsRepo.delete(mechanicId);
    return { message: 'Mekanik silindi' };
  }

  async getAiSummary(sessionId: number, userId: number) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
      relations: { creator: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı');

    const rawIdeas = await this.ideasRepo.find({
      where: { session: { id: sessionId } },
      relations: { voters: true, mechanics: { voters: true } },
      order: { createdAt: 'ASC' },
    });

    if (rawIdeas.length === 0) {
      return { summary: 'Analiz yapılabilmesi için oturumda en az bir fikir olmalıdır.' };
    }

    const ideas = rawIdeas.map((idea) => ({
      title: idea.title,
      description: idea.description,
      voteCount: idea.voters.length,
      mechanics: (idea.mechanics ?? []).map((m) => ({
        title: m.title,
        description: m.description,
        voteCount: m.voters.length,
      })),
    }));

    const summary = await this.geminiService.analyzeIdeas(session.title, session.description, ideas);
    return { summary };
  }

  async toggleMechanicVote(mechanicId: number, userId: number) {
    const mechanic = await this.mechanicsRepo.findOne({
      where: { id: mechanicId },
      relations: { voters: true },
    });
    if (!mechanic) throw new NotFoundException('Mekanik bulunamadı');
    const idx = mechanic.voters.findIndex((v) => v.id === userId);
    if (idx >= 0) {
      mechanic.voters.splice(idx, 1);
    } else {
      mechanic.voters.push({ id: userId } as User);
    }
    await this.mechanicsRepo.save(mechanic);
    return { voteCount: mechanic.voters.length, hasVoted: idx < 0 };
  }
}
