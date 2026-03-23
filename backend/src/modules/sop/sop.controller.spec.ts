import { Test, TestingModule } from '@nestjs/testing';
import { SopController } from './sop.controller';
import { SopService } from './sop.service';

describe('SopController', () => {
  let controller: SopController;
  const sopService = {
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SopController],
      providers: [
        {
          provide: SopService,
          useValue: sopService,
        },
      ],
    }).compile();

    controller = module.get<SopController>(SopController);
  });

  it('passes company context to findOne', async () => {
    await controller.findOne('company-1', 'sop-1');
    expect(sopService.findOne).toHaveBeenCalledWith('company-1', 'sop-1');
  });

  it('passes company context to update', async () => {
    const data = { title: 'Escalation SOP' };
    await controller.update('company-1', 'sop-1', data);
    expect(sopService.update).toHaveBeenCalledWith('company-1', 'sop-1', data);
  });

  it('passes company context to remove', async () => {
    await controller.remove('company-1', 'sop-1');
    expect(sopService.remove).toHaveBeenCalledWith('company-1', 'sop-1');
  });
});
