import { AuditLogMiddleware } from './audit-log.middleware';

describe('AuditLogMiddleware', () => {
  it('logs successful state-changing requests with the canonical userId field', async () => {
    const auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };
    const middleware = new AuditLogMiddleware(auditService as any);
    let finishHandler: (() => void) | undefined;

    const req = {
      method: 'POST',
      path: '/documents/doc-1',
      body: { name: 'contract.pdf' },
      ip: '127.0.0.1',
      user: {
        companyId: 'company-1',
        userId: 'user-1',
      },
      get: jest.fn().mockReturnValue('jest-agent'),
    } as any;
    const res = {
      statusCode: 201,
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
      }),
    } as any;

    middleware.use(req, res, jest.fn());
    finishHandler?.();
    await new Promise(process.nextTick);

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        userId: 'user-1',
        action: 'POST',
      }),
    );
  });
});
