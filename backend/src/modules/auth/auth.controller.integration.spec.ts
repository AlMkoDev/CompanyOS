import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Response } from 'supertest';

jest.mock('./auth.service', () => ({
  AuthService: class AuthService {},
}));

import { AuthController } from './auth.controller';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.strategy';

describe('AuthController integration', () => {
  let app: INestApplication;
  let guardSpy: jest.SpyInstance;
  let authService: {
    login: jest.Mock;
    verifyLoginMfaCode: jest.Mock;
    generateLoginMfaSetup: jest.Mock;
    verifyLoginMfaSetup: jest.Mock;
    getCurrentUser: jest.Mock;
    register: jest.Mock;
    generateMfaSecret: jest.Mock;
    verifyMfaCode: jest.Mock;
  };

  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      AUTH_COOKIE_NAME: 'companyos_auth',
      AUTH_COOKIE_SAME_SITE: 'lax',
      AUTH_COOKIE_SECURE: 'false',
      AUTH_COOKIE_MAX_AGE_MS: '1800000',
    };

    authService = {
      login: jest.fn(),
      verifyLoginMfaCode: jest.fn(),
      generateLoginMfaSetup: jest.fn(),
      verifyLoginMfaSetup: jest.fn(),
      getCurrentUser: jest.fn(),
      register: jest.fn(),
      generateMfaSecret: jest.fn(),
      verifyMfaCode: jest.fn(),
    };

    guardSpy = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = { userId: 'user-1' };
        return true;
      });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        AuthRateLimitGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    guardSpy.mockRestore();
    process.env = originalEnv;
  });

  it('sets the auth cookie on successful login', async () => {
    authService.login.mockResolvedValue({
      access_token: 'jwt-token',
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@example.com', password: 'password' })
      .expect(200);

    expect(authService.login).toHaveBeenCalledWith(
      'owner@example.com',
      'password',
      expect.objectContaining({
        ipAddress: expect.any(String),
      }),
    );
    expect(getCookieHeader(response)).toContain('companyos_auth=jwt-token');
    expect(getCookieHeader(response)).toContain('HttpOnly');
    expect(getCookieHeader(response)).toContain('SameSite=Lax');
  });

  it('rate limits repeated login attempts for the same client and email', async () => {
    authService.login.mockResolvedValue({
      access_token: 'jwt-token',
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'owner@example.com', password: 'password' })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@example.com', password: 'password' })
      .expect(429);

    expect(authService.login).toHaveBeenCalledTimes(5);
  });

  it('passes registration through without setting an auth cookie', async () => {
    authService.register.mockResolvedValue({
      user: { id: 'user-1', email: 'owner@example.com' },
      company: { id: 'company-1', name: 'CompanyOS' },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'owner@example.com',
        password: 'Password123!',
        companyName: 'CompanyOS',
        firstName: 'Owner',
        lastName: 'User',
      })
      .expect(201);

    expect(authService.register).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'Password123!',
      companyName: 'CompanyOS',
      firstName: 'Owner',
      lastName: 'User',
    });
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('does not set the auth cookie for an MFA challenge response', async () => {
    authService.login.mockResolvedValue({
      mfaRequired: true,
      mfaToken: 'mfa-token',
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@example.com', password: 'password' })
      .expect(200);

    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body).toEqual({
      mfaRequired: true,
      mfaToken: 'mfa-token',
      user: { id: 'user-1', email: 'owner@example.com' },
    });
  });

  it('does not set the auth cookie for an MFA setup-required response', async () => {
    authService.login.mockResolvedValue({
      mfaSetupRequired: true,
      mfaSetupToken: 'setup-token',
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@example.com', password: 'password' })
      .expect(200);

    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body).toEqual({
      mfaSetupRequired: true,
      mfaSetupToken: 'setup-token',
      user: { id: 'user-1', email: 'owner@example.com' },
    });
  });

  it('sets the auth cookie after MFA login verification', async () => {
    authService.verifyLoginMfaCode.mockResolvedValue({
      access_token: 'verified-jwt',
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/mfa/login-verify')
      .send({ token: 'mfa-token', code: '123456' })
      .expect(200);

    expect(authService.verifyLoginMfaCode).toHaveBeenCalledWith(
      'mfa-token',
      '123456',
      expect.objectContaining({
        ipAddress: expect.any(String),
      }),
    );
    expect(getCookieHeader(response)).toContain('companyos_auth=verified-jwt');
  });

  it('returns login MFA setup details without setting an auth cookie', async () => {
    authService.generateLoginMfaSetup.mockResolvedValue({
      secret: 'secret',
      otpauthUrl: 'otpauth://totp/CompanyOS',
      qrCodeDataUrl: 'data:image/png;base64,abc',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/mfa/setup-login')
      .send({ token: 'setup-token' })
      .expect(201);

    expect(authService.generateLoginMfaSetup).toHaveBeenCalledWith(
      'setup-token',
      expect.objectContaining({
        ipAddress: expect.any(String),
      }),
    );
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body).toEqual({
      secret: 'secret',
      otpauthUrl: 'otpauth://totp/CompanyOS',
      qrCodeDataUrl: 'data:image/png;base64,abc',
    });
  });

  it('sets the auth cookie after MFA setup verification during login', async () => {
    authService.verifyLoginMfaSetup.mockResolvedValue({
      access_token: 'setup-verified-jwt',
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/mfa/setup-login-verify')
      .send({ token: 'setup-token', code: '123456' })
      .expect(200);

    expect(authService.verifyLoginMfaSetup).toHaveBeenCalledWith(
      'setup-token',
      '123456',
      expect.objectContaining({
        ipAddress: expect.any(String),
      }),
    );
    expect(getCookieHeader(response)).toContain('companyos_auth=setup-verified-jwt');
  });

  it('uses secure cookie settings when same-site none is configured', async () => {
    process.env.AUTH_COOKIE_SAME_SITE = 'none';
    process.env.AUTH_COOKIE_SECURE = 'true';

    authService.login.mockResolvedValue({
      access_token: 'jwt-token',
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@example.com', password: 'password' })
      .expect(200);

    expect(getCookieHeader(response)).toContain('SameSite=None');
    expect(getCookieHeader(response)).toContain('Secure');
  });

  it('clears the auth cookie on logout', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .expect(200);

    expect(getCookieHeader(response)).toContain('companyos_auth=');
    expect(getCookieHeader(response)).toContain('Expires=');
    expect(response.body).toEqual({ success: true });
  });

  it('calls MFA setup for the authenticated user', async () => {
    authService.generateMfaSecret.mockResolvedValue({
      secret: 'secret',
      otpauthUrl: 'otpauth://totp/CompanyOS',
      qrCodeDataUrl: 'data:image/png;base64,abc',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/mfa/setup')
      .expect(201);

    expect(authService.generateMfaSecret).toHaveBeenCalledWith('user-1');
    expect(response.body).toEqual({
      secret: 'secret',
      otpauthUrl: 'otpauth://totp/CompanyOS',
      qrCodeDataUrl: 'data:image/png;base64,abc',
    });
  });

  it('verifies MFA for the authenticated user', async () => {
    authService.verifyMfaCode.mockResolvedValue({ success: true });

    const response = await request(app.getHttpServer())
      .post('/auth/mfa/verify')
      .send({ code: '123456' })
      .expect(201);

    expect(authService.verifyMfaCode).toHaveBeenCalledWith('user-1', '123456');
    expect(response.body).toEqual({ success: true });
  });

  it('returns the current user payload from the session-backed me endpoint', async () => {
    authService.getCurrentUser.mockResolvedValue({
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .expect(200);

    expect(authService.getCurrentUser).toHaveBeenCalledWith('user-1');
    expect(response.body).toEqual({
      user: { id: 'user-1', email: 'owner@example.com' },
    });
  });
});

function getCookieHeader(response: Response) {
  const cookies = response.headers['set-cookie'];
  return Array.isArray(cookies) ? cookies.join('; ') : '';
}
