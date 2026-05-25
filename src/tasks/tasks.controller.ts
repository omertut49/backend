import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, UseGuards, ParseIntPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';

class BulkUpdateDto extends UpdateTaskDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  ids: number[];
}

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.tasksService.create(dto, user.id, user.role);
  }

  @Get()
  findAll(
    @Query('projectId') projectId: string,
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('assigneeId') assigneeId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.tasksService.findAll(
      {
        projectId: projectId ? +projectId : undefined,
        status,
        priority,
        assigneeId: assigneeId ? +assigneeId : undefined,
        page: page ? +page : 1,
        limit: limit ? +limit : 20,
      },
      user.id,
      user.role,
    );
  }

  @Get('calendar')
  getCalendar(
    @Query('start') start: string,
    @Query('end') end: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.tasksService.getCalendar(start, end, user.id, user.role);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.tasksService.findOne(id, user.id, user.role);
  }

  @Patch('bulk')
  bulkUpdate(
    @Body() body: BulkUpdateDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    const { ids, ...dto } = body;
    return this.tasksService.bulkUpdate(ids, dto, user.id, user.role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.tasksService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.tasksService.remove(id, user.id, user.role);
  }
}
