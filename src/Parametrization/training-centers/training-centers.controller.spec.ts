import { Test, TestingModule } from '@nestjs/testing';
import { TrainingCentersController } from './training-centers.controller';
import { TrainingCentersService } from './training-centers.service';

describe('TrainingCentersController', () => {
  let controller: TrainingCentersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingCentersController],
      providers: [TrainingCentersService],
    }).compile();

    controller = module.get<TrainingCentersController>(TrainingCentersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
