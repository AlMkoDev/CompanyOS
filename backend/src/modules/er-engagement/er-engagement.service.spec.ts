import { Test, TestingModule } from '@nestjs/testing';
import { ErEngagementService } from './er-engagement.service';
import { PrismaService } from '../../database/prisma.service';

describe('ErEngagementService', () => {
  let service: ErEngagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErEngagementService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ErEngagementService>(ErEngagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
