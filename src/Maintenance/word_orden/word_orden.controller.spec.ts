import { Test, TestingModule } from '@nestjs/testing';
import { WordOrdenController } from './word_orden.controller';
import { WordOrdenService } from './word_orden.service';

describe('WordOrdenController', () => {
  let controller: WordOrdenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WordOrdenController],
      providers: [WordOrdenService],
    }).compile();

    controller = module.get<WordOrdenController>(WordOrdenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
