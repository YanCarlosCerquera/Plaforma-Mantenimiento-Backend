import { Test, TestingModule } from '@nestjs/testing';
import { DependeceController } from './dependece.controller';
import { DependeceService } from './dependece.service';

describe('DependeceController', () => {
  let controller: DependeceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DependeceController],
      providers: [DependeceService],
    }).compile();

    controller = module.get<DependeceController>(DependeceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
