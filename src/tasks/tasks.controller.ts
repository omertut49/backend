import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Player } from '../players/entities/player.entity';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private service: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser() player: Player) {
    return this.service.create(dto, player.id);
  }

  @Get('my')
  findMine(@CurrentUser() player: Player) {
    return this.service.findMine(player.id);
  }

  @Get()
  @ApiQuery({ name: 'gameId', required: false })
  @ApiQuery({ name: 'phaseId', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  findAll(
    @Query('gameId') gameId: string | undefined,
    @Query('phaseId') phaseId: string | undefined,
    @Query('assigneeId') assigneeId: string | undefined,
    @CurrentUser() player: Player,
  ) {
    return this.service.findAll(gameId, phaseId, assigneeId, player.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.findOne(id, player.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() player: Player) {
    return this.service.update(id, dto, player.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.remove(id, player.id);
  }
}
