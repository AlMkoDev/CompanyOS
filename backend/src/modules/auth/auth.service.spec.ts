import * as bcrypt from 'bcrypt';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn(),
    keyuri: jest.fn(),
    verify: jest.fn(),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

describe('AuthService', () => {
  const originalEnv = process.env;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    process.env = {
      ...originalEnv,
      REQUIRED_MFA_ROLES: 'Super Admin,Admin,Owner',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  afterEach(() => {
    loggerWarnSpy.mockRestore();
  });

  it('requires MFA setup for privileged users without MFA enabled', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'owner@example.com',
          password_hash: 'hash',
          first_name: 'Owner',
          last_name: 'User',
          company_id: 'company-1',
          company: { id: 'company-1' },
          mfa_enabled: false,
          department_members: [{ role: { name: 'Super Admin' } }],
        }),
      },
      companySetup: {
        upsert: jest.fn().mockResolvedValue({ id: 'setup-1', company_id: 'company-1' }),
      },
    };

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('setup-token'),
    };

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const service = new AuthService(prisma, jwtService as any);
    const result = await service.login('owner@example.com', 'Password123!');

    expect(result).toEqual({
      mfaSetupRequired: true,
      mfaSetupToken: 'setup-token',
      user: {
        id: 'user-1',
        email: 'owner@example.com',
        firstName: 'Owner',
        lastName: 'User',
        companyId: 'company-1',
        company: expect.objectContaining({ id: 'company-1' }),
        roles: ['Super Admin'],
        mfaEnabled: false,
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        sub: 'user-1',
        purpose: 'mfa-setup',
      },
      { expiresIn: '10m' },
    );
  });

  it('returns a direct access token for non-privileged users without MFA enabled', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-2',
          email: 'member@example.com',
          password_hash: 'hash',
          first_name: 'Member',
          last_name: 'User',
          company_id: 'company-1',
          company: { id: 'company-1' },
          mfa_enabled: false,
          department_members: [{ role: { name: 'Contributor' } }],
        }),
      },
      companySetup: {
        upsert: jest.fn().mockResolvedValue({ id: 'setup-1', company_id: 'company-1' }),
      },
    };

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const service = new AuthService(prisma, jwtService as any);
    const result = await service.login('member@example.com', 'Password123!');

    expect(result).toEqual({
      access_token: 'access-token',
      user: {
        id: 'user-2',
        email: 'member@example.com',
        firstName: 'Member',
        lastName: 'User',
        companyId: 'company-1',
        company: expect.objectContaining({ id: 'company-1' }),
        roles: ['Contributor'],
        mfaEnabled: false,
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-2',
      email: 'member@example.com',
      companyId: 'company-1',
      roles: ['Contributor'],
    });
  });

  it('returns an MFA challenge for users with MFA enabled', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-3',
          email: 'secured@example.com',
          password_hash: 'hash',
          first_name: 'Secured',
          last_name: 'User',
          company_id: 'company-1',
          company: { id: 'company-1' },
          mfa_enabled: true,
          mfa_secret: 'secret',
          department_members: [{ role: { name: 'Super Admin' } }],
        }),
      },
      companySetup: {
        upsert: jest.fn().mockResolvedValue({ id: 'setup-1', company_id: 'company-1' }),
      },
    };

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('mfa-token'),
    };

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const service = new AuthService(prisma, jwtService as any);
    const result = await service.login('secured@example.com', 'Password123!');

    expect(result).toEqual({
      mfaRequired: true,
      mfaToken: 'mfa-token',
      user: {
        id: 'user-3',
        email: 'secured@example.com',
        firstName: 'Secured',
        lastName: 'User',
        companyId: 'company-1',
        company: expect.objectContaining({ id: 'company-1' }),
        roles: ['Super Admin'],
        mfaEnabled: true,
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        sub: 'user-3',
        purpose: 'mfa-login',
      },
      { expiresIn: '5m' },
    );
  });

  it('logs a structured security event for failed login attempts', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const jwtService = {
      signAsync: jest.fn(),
    };

    const service = new AuthService(prisma, jwtService as any);

    await expect(
      service.login('owner@example.com', 'wrong-password', {
        ipAddress: '127.0.0.1',
        userAgent: 'jest-test',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"auth.login.failed"'),
    );
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"invalid_credentials"'),
    );
  });

  it('hydrates missing setup state through auth/me and includes companyId in the user payload', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'owner@example.com',
          first_name: 'Owner',
          last_name: 'User',
          company_id: 'company-1',
          mfa_enabled: true,
          company: { id: 'company-1', setup: null },
          department_members: [{ role: { name: 'Super Admin' } }],
        }),
      },
      companySetup: {
        upsert: jest.fn().mockResolvedValue({ id: 'setup-1', company_id: 'company-1' }),
      },
    };

    const service = new AuthService(prisma, { signAsync: jest.fn() } as any);
    const result = await service.getCurrentUser('user-1');

    expect(prisma.companySetup.upsert).toHaveBeenCalledWith({
      where: { company_id: 'company-1' },
      update: {},
      create: { company_id: 'company-1' },
    });
    expect(result).toEqual({
      user: expect.objectContaining({
        id: 'user-1',
        companyId: 'company-1',
        roles: ['Super Admin'],
      }),
    });
  });
});
