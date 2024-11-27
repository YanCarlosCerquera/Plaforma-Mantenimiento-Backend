import { Test, TestingModule } from '@nestjs/testing';
import { WorkReportService } from './work_report.service';

describe('WorkReportService', () => {
  let service: WorkReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkReportService],
    }).compile();

    service = module.get<WorkReportService>(WorkReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
