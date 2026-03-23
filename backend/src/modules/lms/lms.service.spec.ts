import { Test, TestingModule } from '@nestjs/testing';
import { LmsService } from './lms.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('LmsService', () => {
  let service: LmsService;
  const prisma: any = {
    course: {
      findFirst: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
    },
    enrolment: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LmsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<LmsService>(LmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects cross-company enrolment status updates', async () => {
    prisma.enrolment.findFirst.mockResolvedValue(null);

    await expect(service.updateEnrolmentStatus('company-1', 'enrol-1', 'completed')).rejects.toThrow(
      NotFoundException,
    );
  });
});
