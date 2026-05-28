import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IdeaSession } from './entities/idea-session.entity';
import { GameIdea } from './entities/game-idea.entity';

@Injectable()
export class IdeasService {
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(IdeaSession) private sessionRepo: Repository<IdeaSession>,
    @InjectRepository(GameIdea) private ideaRepo: Repository<GameIdea>,
    private config: ConfigService,
  ) {
    this.genAI = new GoogleGenerativeAI(config.get<string>('GEMINI_API_KEY', ''));
  }

  createSession(title: string, createdById: string) {
    const session = this.sessionRepo.create({ title, createdById });
    return this.sessionRepo.save(session);
  }

  findAllSessions() {
    return this.sessionRepo.find({
      relations: { createdBy: true, ideas: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findSession(id: string) {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: { createdBy: true, ideas: { createdBy: true } },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı');
    return session;
  }

  addIdea(sessionId: string, title: string, description: string, createdById: string) {
    const idea = this.ideaRepo.create({ sessionId, title, description, createdById });
    return this.ideaRepo.save(idea);
  }

  async vote(ideaId: string) {
    await this.ideaRepo.increment({ id: ideaId }, 'votes', 1);
    return this.ideaRepo.findOne({ where: { id: ideaId } });
  }

  async generateSummary(sessionId: string) {
    const session = await this.findSession(sessionId);
    const ideas = session.ideas.map((i) => `- ${i.title}: ${i.description || ''}`).join('\n');

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Aşağıdaki oyun fikirleri için kısa bir Türkçe analiz yap ve en iyi 3 fikri öner:\n\n${ideas}`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    await this.sessionRepo.update(sessionId, { aiSummary: summary });
    return { summary };
  }

  async generateProjectPlan(sessionId: string) {
    const session = await this.findSession(sessionId);
    const ideas = session.ideas.map((i) => `- ${i.title}: ${i.description || ''}`).join('\n');

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Bu oyun fikirleri için Türkçe bir proje planı oluştur. JSON formatında döndür: {"projectName": "...", "projectDescription": "...", "tasks": [{"title": "...", "description": "...", "priority": "low|medium|high"}]}. Sadece JSON döndür.\n\nFikirler:\n${ideas}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(text);
  }

  async deleteSession(id: string) {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Oturum bulunamadı');
    await this.sessionRepo.remove(session);
    return { message: 'Oturum silindi' };
  }
}
