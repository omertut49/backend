import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Comment } from './entities/comment.entity';
import { CommentReaction } from './entities/comment-reaction.entity';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { BugReport } from '../bug-reports/entities/bug-report.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentsRepo: Repository<Comment>,
    @InjectRepository(CommentReaction) private reactionsRepo: Repository<CommentReaction>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    @InjectRepository(BugReport) private bugsRepo: Repository<BugReport>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateCommentDto, userId: number): Promise<Comment> {
    if (!dto.taskId && !dto.bugId) {
      throw new BadRequestException('taskId veya bugId zorunludur');
    }

    const author = await this.usersRepo.findOneBy({ id: userId });
    const comment = this.commentsRepo.create({ content: dto.content, author });

    if (dto.taskId) {
      const task = await this.tasksRepo.findOne({
        where: { id: dto.taskId },
        relations: { assignee: true, project: true },
      });
      if (!task) throw new NotFoundException('Görev bulunamadı');
      comment.task = task;

      // @mention kontrolü ve bildirimi
      await this.parseMentions(dto.content, userId);
    }

    if (dto.bugId) {
      const bug = await this.bugsRepo.findOne({
        where: { id: dto.bugId },
        relations: { reporter: true, assignee: true },
      });
      if (!bug) throw new NotFoundException('Bug bulunamadı');
      comment.bug = bug;

      await this.parseMentions(dto.content, userId);
    }

    if (dto.parentCommentId) {
      const parent = await this.commentsRepo.findOneBy({ id: dto.parentCommentId });
      if (!parent) throw new NotFoundException('Üst yorum bulunamadı');
      comment.parentComment = parent;
    }

    const saved = await this.commentsRepo.save(comment);

    this.eventEmitter.emit('activity.log', {
      action: 'CREATED', entity: 'comment', entityId: saved.id,
      userId, details: { taskId: dto.taskId, bugId: dto.bugId },
    });

    return this.findOne(saved.id);
  }

  async findByTask(taskId: number): Promise<Comment[]> {
    return this.commentsRepo.find({
      where: { task: { id: taskId }, parentComment: IsNull() },
      relations: { author: true, replies: { author: true }, reactions: { user: true } },
      order: { createdAt: 'ASC' },
    });
  }

  async findByBug(bugId: number): Promise<Comment[]> {
    return this.commentsRepo.find({
      where: { bug: { id: bugId }, parentComment: IsNull() },
      relations: { author: true, replies: { author: true }, reactions: { user: true } },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentsRepo.findOne({
      where: { id },
      relations: { author: true, replies: { author: true }, reactions: { user: true } },
    });
    if (!comment) throw new NotFoundException(`Yorum ${id} bulunamadı`);
    return comment;
  }

  async update(id: number, dto: UpdateCommentDto, userId: number): Promise<Comment> {
    const comment = await this.findOne(id);

    if (comment.author?.id !== userId) {
      throw new ForbiddenException('Sadece kendi yorumunuzu düzenleyebilirsiniz');
    }

    await this.commentsRepo.update(id, { content: dto.content, isEdited: true });
    return this.findOne(id);
  }

  async remove(id: number, userId: number, role: string): Promise<void> {
    const comment = await this.findOne(id);

    if (comment.author?.id !== userId && role !== 'admin') {
      throw new ForbiddenException('Sadece kendi yorumunuzu silebilirsiniz');
    }

    await this.commentsRepo.softDelete(id);
  }

  // Reaksiyon ekle / kaldır (toggle)
  async toggleReaction(commentId: number, emoji: string, userId: number): Promise<{ added: boolean }> {
    const comment = await this.commentsRepo.findOneBy({ id: commentId });
    if (!comment) throw new NotFoundException('Yorum bulunamadı');

    const existing = await this.reactionsRepo.findOne({
      where: { comment: { id: commentId }, user: { id: userId }, emoji },
    });

    if (existing) {
      await this.reactionsRepo.remove(existing);
      return { added: false };
    }

    const user = await this.usersRepo.findOneBy({ id: userId });
    const reaction = this.reactionsRepo.create({ comment, user, emoji });
    await this.reactionsRepo.save(reaction);
    return { added: true };
  }

  // @mention parsing — içerikte @isim varsa bildirim gönder
  private async parseMentions(content: string, senderId: number): Promise<void> {
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    if (!mentions) return;

    const uniqueNames = [...new Set(mentions.map((m) => m.slice(1)))];

    for (const name of uniqueNames) {
      const matched = await this.usersRepo.findBy({ name });
      // İsim benzersiz değilse mention belirsiz — bildirim gönderilmez
      if (matched.length !== 1) continue;
      const user = matched[0];
      if (user.id !== senderId) {
        this.eventEmitter.emit('notification.create', {
          userId: user.id,
          message: `Bir yorumda bahsedildiniz: "${content.slice(0, 50)}..."`,
          type: 'COMMENT_MENTION',
          entityId: user.id,
          entityType: 'comment',
        });
      }
    }
  }
}
