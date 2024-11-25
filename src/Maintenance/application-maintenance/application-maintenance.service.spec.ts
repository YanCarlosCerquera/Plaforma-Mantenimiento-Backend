import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationMaintenanceService } from './application-maintenance.service';

describe('ApplicationMaintenanceService', () => {
  let service: ApplicationMaintenanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationMaintenanceService],
    }).compile();

    service = module.get<ApplicationMaintenanceService>(ApplicationMaintenanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
