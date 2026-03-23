import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { SopService } from './sop.service';

describe('SopService', () => {
  let service: SopService;
  const prisma = {
    sOP: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SopService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<SopService>(SopService);
  });

  it('rejects cross-company SOP lookup', async () => {
    prisma.sOP.findFirst.mockResolvedValue(null);

    await expect(service.findOne('company-1', 'sop-1')).rejects.toThrow(NotFoundException);
  });

  it('checks company ownership before update', async () => {
    prisma.sOP.findFirst.mockResolvedValue({ id: 'sop-1' });
    prisma.sOP.update.mockResolvedValue({ id: 'sop-1', title: 'Updated' });

    await service.update('company-1', 'sop-1', { title: 'Updated' });

    expect(prisma.sOP.findFirst).toHaveBeenCalledWith({
      where: { id: 'sop-1', company_id: 'company-1' },
      include: { department: true },
    });
    expect(prisma.sOP.update).toHaveBeenCalledWith({
      where: { id: 'sop-1' },
      data: { title: 'Updated' },
    });
  });
});
