import { Test, TestingModule } from '@nestjs/testing';
import { AtsService } from './ats.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AtsService', () => {
  let service: AtsService;
  let prisma: {
    jobRequisition: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    candidate: {
      create: jest.Mock;
      findFirst: jest.Mock;
    };
    application: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    interview: {
      create: jest.Mock;
      findFirst: jest.Mock;
    };
    scorecard: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      jobRequisition: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      candidate: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      application: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      interview: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      scorecard: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AtsService>(AtsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects requisition detail access outside the caller company', async () => {
    prisma.jobRequisition.findFirst.mockResolvedValue(null);

    await expect(service.getRequisitionDetail('company-1', 'req-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects candidate detail access outside the caller company', async () => {
    prisma.candidate.findFirst.mockResolvedValue(null);

    await expect(service.getCandidateDetail('company-1', 'cand-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects application stage updates outside the caller company', async () => {
    prisma.application.findFirst.mockResolvedValue(null);

    await expect(service.updateStage('company-1', 'app-1', 'interview1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects interview scheduling outside the caller company', async () => {
    prisma.application.findFirst.mockResolvedValue(null);

    await expect(
      service.scheduleInterview('company-1', 'app-1', { notes: 'screen' }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.interview.create).not.toHaveBeenCalled();
  });

  it('rejects scorecard submission outside the caller company', async () => {
    prisma.interview.findFirst.mockResolvedValue(null);

    await expect(
      service.submitScorecard('company-1', 'int-1', 'user-1', { summary: 'strong fit' }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.scorecard.create).not.toHaveBeenCalled();
  });
});
