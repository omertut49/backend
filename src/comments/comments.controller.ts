import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

class ReactionDto {
  @IsString()
  @IsNotEmpty()
  emoji: string;
}

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.commentsService.create(dto, user.id);
  }

  @Get()
  findAll(
    @Query('taskId') taskId: string,
    @Query('bugId') bugId: string,
  ) {
    if (taskId) return this.commentsService.findByTask(+taskId);
    if (bugId) return this.commentsService.findByBug(+bugId);
    return [];
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.commentsService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.commentsService.remove(id, user.id, user.role);
  }

  @Post(':id/reactions')
  toggleReaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReactionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.commentsService.toggleReaction(id, dto.emoji, user.id);
  }
}
