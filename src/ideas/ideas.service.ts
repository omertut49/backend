import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IdeaSession } from './entities/idea-session.entity';
import { Game } from '../games/entities/game.entity';
import { Phase, DEFAULT_PHASES } from '../phases/entities/phase.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';

export interface AiTask {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface AiPhase {
  type: string;
  tasks: AiTask[];
}

export interface AiPlan {
  projectName: string;
  projectDescription: string;
  genre?: string;
  phases: AiPhase[];
}

@Injectable()
export class IdeasService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    @InjectRepository(IdeaSession) private sessionRepo: Repository<IdeaSession>,
    private dataSource: DataSource,
    private config: ConfigService,
  ) {
    const apiKey = config.get<string>('GEMINI_API_KEY', '');
    if (apiKey) this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generate(prompt: string, playerId: string) {
    if (!this.genAI) {
      throw new InternalServerErrorException('AI servisi yapılandırılmamış (GEMINI_API_KEY eksik)');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const fullPrompt = `Aşağıdaki oyun fikri için bir proje planı oluştur. Türkçe yanıt ver. Sadece JSON döndür, başka metin ekleme:

{
  "projectName": "string",
  "projectDescription": "string",
  "genre": "action|rpg|puzzle|strategy|simulation|sports|other",
  "phases": [
    { "type": "concept_design", "tasks": [{ "title": "string", "description": "string", "priority": "low|medium|high" }] },
    { "type": "prototype", "tasks": [...] },
    { "type": "art_visual", "tasks": [...] },
    { "type": "production", "tasks": [...] },
    { "type": "test_balance", "tasks": [...] },
    { "type": "polish", "tasks": [...] },
    { "type": "release", "tasks": [...] }
  ]
}

Oyun fikri: ${prompt}`;

    const callAI = async (): Promise<string> => {
      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    };

    let text: string;
    try {
      text = await callAI();
    } catch {
      try {
        text = await callAI();
      } catch {
        throw new InternalServerErrorException('AI servisi yanıt vermedi. Lütfen tekrar deneyin.');
      }
    }

    const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
    let plan: AiPlan;
    try {
      plan = JSON.parse(cleanJson);
    } catch {
      throw new InternalServerErrorException('AI yanıtı işlenemedi. Lütfen tekrar deneyin.');
    }

    const session = this.sessionRepo.create({
      prompt,
      aiPlan: JSON.stringify(plan),
      createdById: playerId,
    });
    const saved = await this.sessionRepo.save(session);

    return { sessionId: saved.id, plan };
  }

  getSessions(playerId: string) {
    return this.sessionRepo.find({
      where: { createdById: playerId },
      order: { createdAt: 'DESC' },
    });
  }

  private async requireSessionOwner(sessionId: string, playerId: string): Promise<IdeaSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Oturum bulunamadı');
    if (session.createdById !== playerId) {
      throw new ForbiddenException('Bu oturuma erişim yetkiniz yok');
    }
    return session;
  }

  async getSession(id: string, playerId: string) {
    const session = await this.requireSessionOwner(id, playerId);
    return {
      ...session,
      plan: session.aiPlan ? (JSON.parse(session.aiPlan) as AiPlan) : null,
    };
  }

  async confirmProject(sessionId: string, playerId: string) {
    const session = await this.requireSessionOwner(sessionId, playerId);
    if (session.isConfirmed) throw new BadRequestException('Bu oturum zaten onaylandı');
    if (!session.aiPlan) throw new BadRequestException('Oluşturulmuş plan bulunamadı');

    const plan: AiPlan = JSON.parse(session.aiPlan);
    const phaseMetaMap = Object.fromEntries(DEFAULT_PHASES.map((p) => [p.type, p]));

    return this.dataSource.transaction(async (manager) => {
      const game = manager.create(Game, {
        title: plan.projectName,
        description: plan.projectDescription,
        genre: (['action', 'rpg', 'puzzle', 'strategy', 'simulation', 'sports', 'other'].includes(plan.genre ?? '')
          ? plan.genre
          : 'other') as Game['genre'],
        ownerId: playerId,
      });
      const savedGame = await manager.save(Game, game);

      const savedPhases: Record<string, Phase> = {};
      for (const meta of DEFAULT_PHASES) {
        const phase = manager.create(Phase, { ...meta, gameId: savedGame.id });
        savedPhases[meta.type] = await manager.save(Phase, phase);
      }

      for (const aiPhase of plan.phases ?? []) {
        const phase = savedPhases[aiPhase.type];
        if (!phase || !aiPhase.tasks?.length) continue;
        const tasks = aiPhase.tasks.map((t) =>
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
        playerId,
        role: 'admin',
      });
      await manager.save(ProjectMember, member);

      await manager.update(IdeaSession, { id: sessionId }, { isConfirmed: true });

      return { gameId: savedGame.id, message: 'Proje başarıyla oluşturuldu' };
    });
  }

  async deleteSession(id: string, playerId: string) {
    const session = await this.requireSessionOwner(id, playerId);
    await this.sessionRepo.remove(session);
    return { message: 'Oturum silindi' };
  }
}
