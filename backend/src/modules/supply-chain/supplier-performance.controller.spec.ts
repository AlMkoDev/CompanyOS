import { SupplierPerformanceController } from './supplier-performance.controller';

describe('SupplierPerformanceController', () => {
  let controller: SupplierPerformanceController;
  let service: {
    getPerformanceDashboard: jest.Mock;
    getAllSupplierScorecards: jest.Mock;
    getSupplierScorecard: jest.Mock;
    calculateSupplierPerformance: jest.Mock;
    getSuppliersByRiskLevel: jest.Mock;
    sendPerformanceAlerts: jest.Mock;
  };

  beforeEach(() => {
    service = {
      getPerformanceDashboard: jest.fn(),
      getAllSupplierScorecards: jest.fn(),
      getSupplierScorecard: jest.fn(),
      calculateSupplierPerformance: jest.fn(),
      getSuppliersByRiskLevel: jest.fn(),
      sendPerformanceAlerts: jest.fn(),
    };

    controller = new SupplierPerformanceController(service as any);
  });

  it('passes canonical company context to supplier performance operations', async () => {
    const req = { user: { companyId: 'company-1' } };

    await controller.getPerformanceDashboard(req);
    await controller.getAllScorecards(req);
    await controller.getSupplierScorecard(req, 'supplier-1');
    await controller.getSuppliersByRiskLevel(req, 'HIGH');
    await controller.sendPerformanceAlerts(req);

    expect(service.getPerformanceDashboard).toHaveBeenCalledWith('company-1');
    expect(service.getAllSupplierScorecards).toHaveBeenCalledWith('company-1');
    expect(service.getSupplierScorecard).toHaveBeenCalledWith('company-1', 'supplier-1');
    expect(service.getSuppliersByRiskLevel).toHaveBeenCalledWith('company-1', 'HIGH');
    expect(service.sendPerformanceAlerts).toHaveBeenCalledWith('company-1');
  });
});
