import { Test, TestingModule } from '@nestjs/testing';
import { ApController } from './ap.controller';
import { ApService } from './ap.service';

describe('ApController', () => {
  let controller: ApController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApController],
      providers: [
        {
          provide: ApService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ApController>(ApController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
