import { Test, TestingModule } from '@nestjs/testing';
import { WorkReportController } from './work_report.controller';
import { WorkReportService } from './work_report.service';

describe('WorkReportController', () => {
  let controller: WorkReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkReportController],
      providers: [WorkReportService],
    }).compile();

    controller = module.get<WorkReportController>(WorkReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
