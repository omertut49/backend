import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { IdeaSession } from './entities/idea-session.entity';
import { GameIdea } from './entities/game-idea.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IdeaSession, GameIdea])],
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}
