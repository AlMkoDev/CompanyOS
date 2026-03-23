import { Test, TestingModule } from '@nestjs/testing';
import { ErEngagementController } from './er-engagement.controller';
import { ErEngagementService } from './er-engagement.service';

describe('ErEngagementController', () => {
  let controller: ErEngagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErEngagementController],
      providers: [
        {
          provide: ErEngagementService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ErEngagementController>(ErEngagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
