import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdeaSession } from './entities/idea-session.entity';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';

@Module({
  imports: [TypeOrmModule.forFeature([IdeaSession])],
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}
