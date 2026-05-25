import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, UseGuards, ParseIntPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BugReportsService } from './bug-reports.service';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { UpdateBugReportDto } from './dto/update-bug-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';

class BulkUpdateDto extends UpdateBugReportDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  ids: number[];
}

@ApiTags('Bug Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bug-reports')
export class BugReportsController {
  constructor(private readonly bugReportsService: BugReportsService) {}

  @Post()
  create(
    @Body() dto: CreateBugReportDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.bugReportsService.create(dto, user.id, user.role);
  }

  @Get()
  findAll(
    @Query('projectId') projectId: string,
    @Query('status') status: string,
    @Query('severity') severity: string,
    @Query('assigneeId') assigneeId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.bugReportsService.findAll(
      {
        projectId: projectId ? +projectId : undefined,
        status,
        severity,
        assigneeId: assigneeId ? +assigneeId : undefined,
        page: page ? +page : 1,
        limit: limit ? +limit : 20,
      },
      user.id,
      user.role,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.bugReportsService.findOne(id, user.id, user.role);
  }

  @Patch('bulk')
  bulkUpdate(
    @Body() body: BulkUpdateDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    const { ids, ...dto } = body;
    return this.bugReportsService.bulkUpdate(ids, dto as UpdateBugReportDto, user.id, user.role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBugReportDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.bugReportsService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.bugReportsService.remove(id, user.id, user.role);
  }
}
