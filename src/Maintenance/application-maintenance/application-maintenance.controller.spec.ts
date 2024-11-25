import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationMaintenanceController } from './application-maintenance.controller';
import { ApplicationMaintenanceService } from './application-maintenance.service';

describe('ApplicationMaintenanceController', () => {
  let controller: ApplicationMaintenanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationMaintenanceController],
      providers: [ApplicationMaintenanceService],
    }).compile();

    controller = module.get<ApplicationMaintenanceController>(ApplicationMaintenanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
