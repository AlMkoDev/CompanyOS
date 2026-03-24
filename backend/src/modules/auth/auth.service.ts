import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import { getMfaIssuer, getRequiredMfaRoles } from '../../common/env';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private authenticatorPromise?: Promise<{
    generateSecret: () => string;
    keyuri: (user: string, service: string, secret: string) => string;
    verify: (options: { token: string; secret: string }) => Promise<boolean>;
  }>;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private logSecurityEvent(event: string, details: Record<string, unknown>) {
    this.logger.warn(JSON.stringify({ event, ...details }));
  }

  private async getAuthenticator() {
    if (!this.authenticatorPromise) {
      this.authenticatorPromise = import('otplib').then((module) => {
        const otplibModule = (
          (module as { default?: Record<string, unknown> }).default || module
        ) as Record<string, unknown>;

        const functionalGenerateSecret =
          typeof otplibModule.generateSecret === 'function'
            ? (otplibModule.generateSecret as (options?: { length?: number }) => string)
            : undefined;
        const functionalGenerateURI =
          typeof otplibModule.generateURI === 'function'
            ? (otplibModule.generateURI as (options: {
                issuer: string;
                label: string;
                secret: string;
              }) => string)
            : undefined;
        const functionalVerify =
          typeof otplibModule.verify === 'function'
            ? (otplibModule.verify as (options: {
                token: string;
                secret: string;
                strategy?: string;
              }) => boolean | Promise<boolean>)
            : undefined;

        if (functionalGenerateSecret && functionalGenerateURI && functionalVerify) {
          return {
            generateSecret: () => functionalGenerateSecret(),
            keyuri: (user: string, service: string, secret: string) =>
              functionalGenerateURI({
                issuer: service,
                label: user,
                secret,
              }),
            verify: async ({ token, secret }) =>
              Boolean(
                await functionalVerify({
                  token,
                  secret,
                  strategy: 'totp',
                }),
              ),
          };
        }

        const OtpClass =
          typeof otplibModule.OTP === 'function'
            ? (otplibModule.OTP as new (options?: { strategy?: string }) => {
                generateSecret: () => string;
                generateURI: (options: { issuer: string; label: string; secret: string }) => string;
                verify: (options: { token: string; secret: string }) => boolean | Promise<boolean>;
              })
            : undefined;

        if (OtpClass) {
          const otp = new OtpClass({ strategy: 'totp' });
          return {
            generateSecret: () => otp.generateSecret(),
            keyuri: (user: string, service: string, secret: string) =>
              otp.generateURI({
                issuer: service,
                label: user,
                secret,
              }),
            verify: async ({ token, secret }) =>
              Boolean(
                await otp.verify({
                  token,
                  secret,
                }),
              ),
          };
        }

        throw new Error('Failed to load otplib exports.');
      });
    }

    return this.authenticatorPromise;
  }

  private getUserRoles(user: {
    department_members: Array<{ role: { name: string } | null }>;
  }) {
    return user.department_members
      .map((m) => m.role?.name)
      .filter((role): role is string => Boolean(role));
  }

  private isMfaRequiredForRoles(roles: string[]) {
    const requiredRoles = getRequiredMfaRoles();
    return roles.some((role) => requiredRoles.includes(role.toLowerCase()));
  }

  private async buildMfaSetupPayload(email: string, secret: string) {
    const serviceName = getMfaIssuer();
    const authenticator = await this.getAuthenticator();
    const otpauthUrl = authenticator.keyuri(email, serviceName, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
    };
  }

  private buildAccessTokenPayload(user: {
    id: string;
    email: string;
    company_id: string;
    department_members: Array<{ role: { name: string } | null }>;
  }) {
    const roles = this.getUserRoles(user);

    return {
      sub: user.id,
      email: user.email,
      companyId: user.company_id,
      roles,
    };
  }

  private buildUserResponse(user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    company: unknown;
    department_members: Array<{ role: { name: string } | null }>;
    mfa_enabled: boolean;
  }) {
    const roles = this.getUserRoles(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      company: user.company,
      roles,
      mfaEnabled: user.mfa_enabled,
    };
  }

  async register(data: any) {
    const { email, password, companyName, firstName, lastName } = data;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    try {
      // Create Company and Super Admin in a transaction
      return await this.prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { name: companyName },
        });

        const user = await tx.user.create({
          data: {
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            company_id: company.id,
          },
        });

        // Initialize company setup tracking
        await tx.companySetup.create({
          data: { company_id: company.id },
        });

        // Add user to a system "Super Admin" role for this company
        const role = await tx.role.create({
          data: {
            company_id: company.id,
            name: 'Super Admin',
            level: 1,
            is_system: true,
          },
        });

        const adminDepartment = await tx.department.create({
          data: {
            company_id: company.id,
            name: 'Administration',
            template_key: 'adm',
          },
        });

        await tx.departmentMember.create({
          data: {
            user_id: user.id,
            department_id: adminDepartment.id,
            role_id: role.id,
            is_head: true,
          },
        });

        return { user, company };
      });
    } catch (error) {
      this.logger.error(
        `Registration failed for ${email.toLowerCase()} / ${companyName}`,
        error instanceof Error ? error.stack : JSON.stringify(error),
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('An account or company record already exists with those details.');
        }

        if (error.code === 'P2003') {
          throw new BadRequestException('Registration failed because related setup data could not be created.');
        }
      }

      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new BadRequestException('Registration request could not be saved with the provided details.');
      }

      throw new BadRequestException('Registration failed unexpectedly. Please try again.');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: { include: { setup: true } },
        department_members: { include: { role: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    // Ensure setup record exists if missing
    if (user.company && !user.company.setup) {
      user.company.setup = await this.prisma.companySetup.upsert({
        where: { company_id: user.company_id },
        update: {},
        create: { company_id: user.company_id },
      });
    }

    return {
      user: this.buildUserResponse(user),
    };
  }

  async login(email: string, pass: string, context?: { ipAddress?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        company: { include: { setup: true } },
        department_members: { include: { role: true } },
      },
    });

    if (!user || !(await bcrypt.compare(pass, user.password_hash))) {
      this.logSecurityEvent('auth.login.failed', {
        email: email.toLowerCase(),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'invalid_credentials',
      });
      throw new UnauthorizedException();
    }

    // Ensure setup record exists if missing
    if (user.company && !user.company.setup) {
      user.company.setup = await this.prisma.companySetup.upsert({
        where: { company_id: user.company_id },
        update: {},
        create: { company_id: user.company_id },
      });
    }

    const roles = this.getUserRoles(user);

    if (user.mfa_enabled) {
      if (!user.mfa_secret) {
        this.logSecurityEvent('auth.login.failed', {
          userId: user.id,
          email: user.email.toLowerCase(),
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
          reason: 'mfa_enabled_without_secret',
        });
        throw new UnauthorizedException('MFA is enabled but not configured correctly for this account.');
      }

      const mfaToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          purpose: 'mfa-login',
        },
        { expiresIn: '5m' },
      );

      return {
        mfaRequired: true,
        mfaToken,
        user: this.buildUserResponse(user),
      };
    }

    if (this.isMfaRequiredForRoles(roles)) {
      const mfaSetupToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          purpose: 'mfa-setup',
        },
        { expiresIn: '10m' },
      );

      return {
        mfaSetupRequired: true,
        mfaSetupToken,
        user: this.buildUserResponse(user),
      };
    }

    return {
      access_token: await this.jwtService.signAsync(this.buildAccessTokenPayload(user)),
      user: this.buildUserResponse(user),
    };
  }

  async generateMfaSecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const authenticator = await this.getAuthenticator();
    const secret = authenticator.generateSecret();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfa_secret: secret,
        mfa_enabled: false,
      },
    });

    return this.buildMfaSetupPayload(user.email, secret);
  }

  async verifyMfaCode(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfa_secret) {
      throw new BadRequestException('MFA has not been set up for this account.');
    }

    const authenticator = await this.getAuthenticator();
    const isValid = await authenticator.verify({
      token: code,
      secret: user.mfa_secret,
    });

    if (!isValid) {
      this.logSecurityEvent('auth.mfa.verify.failed', {
        userId,
        reason: 'invalid_code',
      });
      throw new UnauthorizedException('Invalid MFA code.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfa_enabled: true },
    });

    return { success: true };
  }

  async verifyLoginMfaCode(
    token: string,
    code: string,
    context?: { ipAddress?: string; userAgent?: string },
  ) {
    let payload: { sub: string; purpose?: string };

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      this.logSecurityEvent('auth.mfa.login.failed', {
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'invalid_or_expired_token',
      });
      throw new UnauthorizedException('Invalid or expired MFA token.');
    }

    if (payload.purpose !== 'mfa-login') {
      this.logSecurityEvent('auth.mfa.login.failed', {
        userId: payload.sub,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'invalid_token_purpose',
      });
      throw new UnauthorizedException('Invalid MFA token purpose.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        company: { include: { setup: true } },
        department_members: { include: { role: true } },
      },
    });

    if (!user || !user.mfa_enabled || !user.mfa_secret) {
      this.logSecurityEvent('auth.mfa.login.failed', {
        userId: payload.sub,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'mfa_not_available',
      });
      throw new UnauthorizedException('MFA is not available for this account.');
    }

    const authenticator = await this.getAuthenticator();
    const isValid = await authenticator.verify({
      token: code,
      secret: user.mfa_secret,
    });

    if (!isValid) {
      this.logSecurityEvent('auth.mfa.login.failed', {
        userId: user.id,
        email: user.email.toLowerCase(),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'invalid_code',
      });
      throw new UnauthorizedException('Invalid MFA code.');
    }

    return {
      access_token: await this.jwtService.signAsync(this.buildAccessTokenPayload(user)),
      user: this.buildUserResponse(user),
    };
  }

  async generateLoginMfaSetup(token: string, context?: { ipAddress?: string; userAgent?: string }) {
    let payload: { sub: string; purpose?: string };

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      this.logSecurityEvent('auth.mfa.setup.failed', {
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'invalid_or_expired_token',
      });
      throw new UnauthorizedException('Invalid or expired MFA setup token.');
    }

    if (payload.purpose !== 'mfa-setup') {
      this.logSecurityEvent('auth.mfa.setup.failed', {
        userId: payload.sub,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'invalid_token_purpose',
      });
      throw new UnauthorizedException('Invalid MFA setup token purpose.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        department_members: { include: { role: true } },
      },
    });

    if (!user) {
      this.logSecurityEvent('auth.mfa.setup.failed', {
        userId: payload.sub,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'user_not_found',
      });
      throw new UnauthorizedException();
    }

    if (!this.isMfaRequiredForRoles(this.getUserRoles(user))) {
      this.logSecurityEvent('auth.mfa.setup.failed', {
        userId: user.id,
        email: user.email.toLowerCase(),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'setup_not_required',
      });
      throw new BadRequestException('MFA setup is not required for this account.');
    }

    const authenticator = await this.getAuthenticator();
    const secret = authenticator.generateSecret();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfa_secret: secret,
        mfa_enabled: false,
      },
    });

    return this.buildMfaSetupPayload(user.email, secret);
  }

  async verifyLoginMfaSetup(
    token: string,
    code: string,
    context?: { ipAddress?: string; userAgent?: string },
  ) {
    let payload: { sub: string; purpose?: string };

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      this.logSecurityEvent('auth.mfa.setup.verify.failed', {
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'invalid_or_expired_token',
      });
      throw new UnauthorizedException('Invalid or expired MFA setup token.');
    }

    if (payload.purpose !== 'mfa-setup') {
      this.logSecurityEvent('auth.mfa.setup.verify.failed', {
        userId: payload.sub,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'invalid_token_purpose',
      });
      throw new UnauthorizedException('Invalid MFA setup token purpose.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        company: { include: { setup: true } },
        department_members: { include: { role: true } },
      },
    });

    if (!user || !user.mfa_secret) {
      this.logSecurityEvent('auth.mfa.setup.verify.failed', {
        userId: payload.sub,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'mfa_setup_unavailable',
      });
      throw new UnauthorizedException('MFA setup is not available for this account.');
    }

    const authenticator = await this.getAuthenticator();
    const isValid = await authenticator.verify({
      token: code,
      secret: user.mfa_secret,
    });

    if (!isValid) {
      this.logSecurityEvent('auth.mfa.setup.verify.failed', {
        userId: user.id,
        email: user.email.toLowerCase(),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        reason: 'invalid_code',
      });
      throw new UnauthorizedException('Invalid MFA code.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfa_enabled: true },
    });

    return {
      access_token: await this.jwtService.signAsync(this.buildAccessTokenPayload(user)),
      user: this.buildUserResponse({ ...user, mfa_enabled: true }),
    };
  }
}
