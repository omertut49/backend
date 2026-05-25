import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Activity Log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activity-log')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @Roles('admin')
  findAll(
    @Query('userId') userId: string,
    @Query('entity') entity: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.activityLogService.findAll({
      userId: userId ? +userId : undefined,
      entity,
      page: page ? +page : 1,
      limit: limit ? +limit : 30,
    });
  }
}
