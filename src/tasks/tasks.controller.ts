import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, UseGuards, ParseIntPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class CompleteTaskDto {
  @IsOptional()
  @IsString()
  note?: string;
}

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(
    @Query('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.tasksService.findAll(projectId, user.id);
  }

  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: { id: number }) {
    return this.tasksService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.tasksService.update(id, dto, user.id);
  }

  @Patch(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteTaskDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.tasksService.complete(id, user.id, dto.note);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.tasksService.remove(id, user.id);
  }
}
