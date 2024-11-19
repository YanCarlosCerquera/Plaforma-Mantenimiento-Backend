import { Test, TestingModule } from '@nestjs/testing';
import { DependeceService } from './dependece.service';

describe('DependeceService', () => {
  let service: DependeceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DependeceService],
    }).compile();

    service = module.get<DependeceService>(DependeceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
