import { GoodsReceiptController } from './goods-receipt.controller';

describe('GoodsReceiptController', () => {
  let controller: GoodsReceiptController;
  let service: {
    createGoodsReceipt: jest.Mock;
    getGoodsReceipt: jest.Mock;
    completeGoodsReceipt: jest.Mock;
    resolveDiscrepancy: jest.Mock;
    getGoodsReceiptsForPO: jest.Mock;
    getPendingGoodsReceipts: jest.Mock;
    getDiscrepancyStats: jest.Mock;
  };

  beforeEach(() => {
    service = {
      createGoodsReceipt: jest.fn(),
      getGoodsReceipt: jest.fn(),
      completeGoodsReceipt: jest.fn(),
      resolveDiscrepancy: jest.fn(),
      getGoodsReceiptsForPO: jest.fn(),
      getPendingGoodsReceipts: jest.fn(),
      getDiscrepancyStats: jest.fn(),
    };

    controller = new GoodsReceiptController(service as any);
  });

  it('passes canonical auth identity fields to create and complete operations', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };
    const createDto = { po_id: 'po-1' };

    await controller.createGoodsReceipt(req, createDto as any);
    await controller.completeGoodsReceipt(req, 'gr-1');

    expect(service.createGoodsReceipt).toHaveBeenCalledWith('company-1', 'user-1', createDto);
    expect(service.completeGoodsReceipt).toHaveBeenCalledWith('company-1', 'gr-1', 'user-1');
  });

  it('passes canonical company context to read endpoints', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };

    await controller.getGoodsReceipt(req, 'gr-1');
    await controller.getGoodsReceiptsForPO(req, 'po-1');
    await controller.getPendingGoodsReceipts(req);

    expect(service.getGoodsReceipt).toHaveBeenCalledWith('company-1', 'gr-1');
    expect(service.getGoodsReceiptsForPO).toHaveBeenCalledWith('company-1', 'po-1');
    expect(service.getPendingGoodsReceipts).toHaveBeenCalledWith('company-1');
  });
});
