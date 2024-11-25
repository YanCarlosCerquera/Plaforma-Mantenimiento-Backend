import { Test, TestingModule } from '@nestjs/testing';
import { WordOrdenService } from './word_orden.service';

describe('WordOrdenService', () => {
  let service: WordOrdenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WordOrdenService],
    }).compile();

    service = module.get<WordOrdenService>(WordOrdenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
