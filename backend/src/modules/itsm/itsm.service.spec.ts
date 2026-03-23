import { Test, TestingModule } from '@nestjs/testing';
import { ItsmService } from './itsm.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ItsmService', () => {
  let service: ItsmService;
  let prisma: {
    iTTicket: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      fields: { sla_deadline: string };
    };
    majorIncidentLog: {
      upsert: jest.Mock;
    };
    changeRequest: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    iTAsset: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
    knowledgeArticle: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      iTTicket: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        fields: { sla_deadline: 'sla_deadline' },
      },
      majorIncidentLog: {
        upsert: jest.fn(),
      },
      changeRequest: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      iTAsset: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      knowledgeArticle: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItsmService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ItsmService>(ItsmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects ticket detail access outside the caller company', async () => {
    prisma.iTTicket.findFirst.mockResolvedValue(null);

    await expect(service.getTicketById('company-1', 'ticket-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects ticket resolution outside the caller company', async () => {
    prisma.iTTicket.findFirst.mockResolvedValue(null);

    await expect(
      service.resolveTicket('company-1', 'ticket-1', 'fixed config'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects change status updates outside the caller company', async () => {
    prisma.changeRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.updateChangeStatus('company-1', 'change-1', 'implemented', 'approved'),
    ).rejects.toThrow(NotFoundException);
  });
});
