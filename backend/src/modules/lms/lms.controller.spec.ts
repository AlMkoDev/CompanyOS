import { Test, TestingModule } from '@nestjs/testing';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';

describe('LmsController', () => {
  let controller: LmsController;
  const lmsService = {
    enrolEmployee: jest.fn(),
    updateEnrolmentStatus: jest.fn(),
    getEmployeeCertificates: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LmsController],
      providers: [
        {
          provide: LmsService,
          useValue: lmsService,
        },
      ],
    }).compile();

    controller = module.get<LmsController>(LmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context through protected LMS routes', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };

    await controller.enrolEmployee(req, { courseId: 'course-1', employeeId: 'employee-1' } as any);
    await controller.updateEnrolmentStatus(req, 'enrol-1', { status: 'completed', score: 95 } as any);
    await controller.getMyCertificates(req);

    expect(lmsService.enrolEmployee).toHaveBeenCalledWith('company-1', 'course-1', 'employee-1');
    expect(lmsService.updateEnrolmentStatus).toHaveBeenCalledWith('company-1', 'enrol-1', 'completed', 95);
    expect(lmsService.getEmployeeCertificates).toHaveBeenCalledWith('company-1', 'user-1');
  });
});
