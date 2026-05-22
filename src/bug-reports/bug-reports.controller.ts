import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BugReportsService } from './bug-reports.service';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { UpdateBugReportDto } from './dto/update-bug-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('bug-reports')
export class BugReportsController {
  constructor(private readonly bugReportsService: BugReportsService) {}

  @Post()
  create(@Body() dto: CreateBugReportDto, @CurrentUser() user: { id: number }) {
    return this.bugReportsService.create({ ...dto, reporterId: dto.reporterId ?? user.id });
  }

  @Get()
  findAll() {
    return this.bugReportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bugReportsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBugReportDto, @CurrentUser() user: { id: number }) {
    return this.bugReportsService.update(+id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: number }) {
    return this.bugReportsService.remove(+id, user.id);
  }
}
