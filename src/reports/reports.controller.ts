import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, UseGuards, ParseIntPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll(
    @Query('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.reportsService.findAll(projectId, user.id);
  }

  @Post()
  create(@Body() dto: CreateReportDto, @CurrentUser() user: { id: number }) {
    return this.reportsService.create(dto, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.reportsService.updateStatus(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.reportsService.remove(id, user.id);
  }
}
