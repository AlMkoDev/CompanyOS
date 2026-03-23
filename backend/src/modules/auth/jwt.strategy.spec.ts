let capturedStrategyOptions: {
  jwtFromRequest: (req: { headers?: { authorization?: string; cookie?: string } }) => string | null;
  ignoreExpiration: boolean;
  secretOrKey: string;
} | null = null;

jest.mock('@nestjs/passport', () => ({
  PassportStrategy:
    (BaseClass: new (options: unknown) => unknown) =>
    class extends BaseClass {
      constructor(...args: ConstructorParameters<typeof BaseClass>) {
        super(...args);
      }
    },
  AuthGuard:
    () =>
    class {
      canActivate() {
        return true;
      }
    },
}));

jest.mock('passport-jwt', () => {
  class MockStrategy {
    constructor(options: typeof capturedStrategyOptions) {
      capturedStrategyOptions = options;
    }
  }

  return {
    Strategy: MockStrategy,
    ExtractJwt: {
      fromAuthHeaderAsBearerToken:
        () =>
        (req: { headers?: { authorization?: string } }) => {
          const header = req?.headers?.authorization;
          if (!header?.startsWith('Bearer ')) {
            return null;
          }

          return header.slice('Bearer '.length);
        },
      fromExtractors:
        (
          extractors: Array<
            (req: { headers?: { authorization?: string; cookie?: string } }) => string | null
          >,
        ) =>
        (req: { headers?: { authorization?: string; cookie?: string } }) => {
          for (const extractor of extractors) {
            const value = extractor(req);
            if (value) {
              return value;
            }
          }

          return null;
        },
    },
  };
});

import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard, JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret',
      AUTH_COOKIE_NAME: 'companyos_auth',
    };
    capturedStrategyOptions = null;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('configures passport-jwt with the backend JWT secret', () => {
    new JwtStrategy();

    expect(capturedStrategyOptions).not.toBeNull();
    expect(capturedStrategyOptions?.secretOrKey).toBe('test-secret');
    expect(capturedStrategyOptions?.ignoreExpiration).toBe(false);
  });

  it('extracts JWTs from the authorization header first', () => {
    new JwtStrategy();

    const token = capturedStrategyOptions?.jwtFromRequest({
      headers: {
        authorization: 'Bearer header-token',
        cookie: 'companyos_auth=cookie-token',
      },
    });

    expect(token).toBe('header-token');
  });

  it('extracts JWTs from the auth cookie when no authorization header is present', () => {
    new JwtStrategy();

    const token = capturedStrategyOptions?.jwtFromRequest({
      headers: {
        cookie: 'other=value; companyos_auth=cookie-token%20value; theme=dark',
      },
    });

    expect(token).toBe('cookie-token value');
  });

  it('returns null when no matching auth cookie exists', () => {
    new JwtStrategy();

    const token = capturedStrategyOptions?.jwtFromRequest({
      headers: {
        cookie: 'other=value; theme=dark',
      },
    });

    expect(token).toBeNull();
  });

  it('maps the JWT payload into the request user shape', async () => {
    const strategy = new JwtStrategy();

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'owner@example.com',
        companyId: 'company-1',
        roles: ['Super Admin'],
      }),
    ).resolves.toEqual({
      userId: 'user-1',
      email: 'owner@example.com',
      companyId: 'company-1',
      roles: ['Super Admin'],
    });
  });
});

describe('JwtAuthGuard', () => {
  it('returns the authenticated user when present', () => {
    const guard = new JwtAuthGuard();
    const user = { userId: 'user-1' };

    expect(guard.handleRequest(null, user, null)).toBe(user);
  });

  it('throws UnauthorizedException when no user is present', () => {
    const guard = new JwtAuthGuard();

    expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
  });

  it('rethrows guard errors when provided', () => {
    const guard = new JwtAuthGuard();
    const error = new Error('boom');

    expect(() => guard.handleRequest(error, null, null)).toThrow(error);
  });
});
