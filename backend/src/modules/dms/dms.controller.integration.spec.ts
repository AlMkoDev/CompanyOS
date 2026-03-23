import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { DmsController } from './dms.controller';
import { DmsService } from './dms.service';

describe('DmsController integration', () => {
  let app: INestApplication;
  let guardSpy: jest.SpyInstance;
  let dmsService: {
    getExplorer: jest.Mock;
    getDocumentDetail: jest.Mock;
    addVersion: jest.Mock;
    toggleLegalHold: jest.Mock;
    deleteDocument: jest.Mock;
  };

  beforeEach(async () => {
    dmsService = {
      getExplorer: jest.fn(),
      getDocumentDetail: jest.fn(),
      addVersion: jest.fn(),
      toggleLegalHold: jest.fn(),
      deleteDocument: jest.fn(),
    };

    guardSpy = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockImplementation((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { companyId: 'company-1', userId: 'user-1' };
        return true;
      });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DmsController],
      providers: [
        {
          provide: DmsService,
          useValue: dmsService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    guardSpy.mockRestore();
  });

  it('loads the explorer through company-scoped context', async () => {
    dmsService.getExplorer.mockResolvedValue({ folders: [], documents: [] });

    const response = await request(app.getHttpServer()).get('/dms/explorer/folder-1').expect(200);

    expect(dmsService.getExplorer).toHaveBeenCalledWith('company-1', 'folder-1');
    expect(response.body).toEqual({ folders: [], documents: [] });
  });

  it('loads document detail through company-scoped context', async () => {
    dmsService.getDocumentDetail.mockResolvedValue({ id: 'doc-1' });

    const response = await request(app.getHttpServer()).get('/dms/documents/doc-1').expect(200);

    expect(dmsService.getDocumentDetail).toHaveBeenCalledWith('company-1', 'doc-1');
    expect(response.body).toEqual({ id: 'doc-1' });
  });

  it('adds versions with company and actor context', async () => {
    dmsService.addVersion.mockResolvedValue({ id: 'version-1' });

    const response = await request(app.getHttpServer())
      .post('/dms/documents/doc-1/versions')
      .send({ fileUrl: 'https://files.example/doc-v2.pdf', changeLog: 'Updated terms' })
      .expect(201);

    expect(dmsService.addVersion).toHaveBeenCalledWith(
      'company-1',
      'doc-1',
      'https://files.example/doc-v2.pdf',
      'user-1',
      'Updated terms',
    );
    expect(response.body).toEqual({ id: 'version-1' });
  });

  it('toggles legal hold with company and actor context', async () => {
    dmsService.toggleLegalHold.mockResolvedValue({ success: true });

    const response = await request(app.getHttpServer())
      .post('/dms/documents/doc-1/legal-hold')
      .send({ reason: 'Litigation' })
      .expect(201);

    expect(dmsService.toggleLegalHold).toHaveBeenCalledWith('company-1', 'doc-1', 'user-1', 'Litigation');
    expect(response.body).toEqual({ success: true });
  });

  it('deletes documents through company-scoped context', async () => {
    dmsService.deleteDocument.mockResolvedValue({ success: true });

    const response = await request(app.getHttpServer())
      .post('/dms/documents/doc-1/delete')
      .expect(201);

    expect(dmsService.deleteDocument).toHaveBeenCalledWith('company-1', 'doc-1');
    expect(response.body).toEqual({ success: true });
  });
});
