import { Test, TestingModule } from '@nestjs/testing';
import { BugReportsService } from './bug-reports.service';

describe('BugReportsService', () => {
  let service: BugReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BugReportsService],
    }).compile();

    service = module.get<BugReportsService>(BugReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
