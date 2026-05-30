import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Player } from '../players/entities/player.entity';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Post()
  create(@Body() dto: CreateReportDto, @CurrentUser() player: Player) {
    return this.service.create(dto, player.id);
  }

  @Get()
  @ApiQuery({ name: 'gameId', required: false })
  findAll(@Query('gameId') gameId: string | undefined, @CurrentUser() player: Player) {
    return this.service.findAll(gameId, player.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.findOne(id, player.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReportDto, @CurrentUser() player: Player) {
    return this.service.update(id, dto, player.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.remove(id, player.id);
  }

  @Post(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() player: Player,
  ) {
    return this.service.resolve(id, dto.resolutionNote, player.id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.approve(id, player.id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() player: Player) {
    return this.service.reject(id, player.id);
  }
}
