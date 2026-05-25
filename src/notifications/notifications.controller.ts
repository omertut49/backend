import { Controller, Get, Patch, Param, UseGuards, ParseIntPipe, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsBoolean, IsString } from 'class-validator';

class UpdatePreferenceDto {
  @IsString()
  type: string;

  @IsBoolean()
  isEnabled: boolean;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: number },
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.notificationsService.findAll(user.id, page ? +page : 1, limit ? +limit : 20);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: { id: number }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: { id: number }) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  updatePreference(
    @Body() dto: UpdatePreferenceDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.notificationsService.updatePreference(user.id, dto.type, dto.isEnabled);
  }
}
