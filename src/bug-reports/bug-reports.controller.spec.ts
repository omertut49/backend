import { Test, TestingModule } from '@nestjs/testing';
import { BugReportsController } from './bug-reports.controller';
import { BugReportsService } from './bug-reports.service';

describe('BugReportsController', () => {
  let controller: BugReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BugReportsController],
      providers: [BugReportsService],
    }).compile();

    controller = module.get<BugReportsController>(BugReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
