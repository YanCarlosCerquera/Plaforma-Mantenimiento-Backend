import { Test, TestingModule } from '@nestjs/testing';
import { TrainingCentersService } from './training-centers.service';

describe('TrainingCentersService', () => {
  let service: TrainingCentersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingCentersService],
    }).compile();

    service = module.get<TrainingCentersService>(TrainingCentersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
