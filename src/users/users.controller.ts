import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  @Get('search')
  async search(@Query('q') q: string) {
    if (!q || q.trim().length < 2) return [];
    return this.usersRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email'])
      .where('user.name ILIKE :q OR user.email ILIKE :q', { q: `%${q.trim()}%` })
      .limit(10)
      .getMany();
  }
}
