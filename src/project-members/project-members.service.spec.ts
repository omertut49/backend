import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectMembersService } from './project-members.service';
import { ProjectMember } from './entities/project-member.entity';
import { Player } from '../players/entities/player.entity';
import { Game } from '../games/entities/game.entity';

describe('ProjectMembersService', () => {
  let service: ProjectMembersService;
  const memberRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProjectMembersService,
        { provide: getRepositoryToken(ProjectMember), useValue: memberRepo },
        { provide: getRepositoryToken(Player), useValue: {} },
        { provide: getRepositoryToken(Game), useValue: {} },
      ],
    }).compile();

    service = module.get(ProjectMembersService);
    jest.clearAllMocks();
  });

  it('requireMember throws when user is not a member', async () => {
    memberRepo.findOne.mockResolvedValue(null);
    await expect(service.requireMember('game-1', 'player-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('requireMember passes when user is a member', async () => {
    memberRepo.findOne.mockResolvedValue({ gameId: 'game-1', playerId: 'player-1', role: 'member' });
    await expect(service.requireMember('game-1', 'player-1')).resolves.toBeUndefined();
  });
});
