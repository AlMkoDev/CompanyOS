import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret',
    };
    delete process.env.AUTH_COOKIE_NAME;
    delete process.env.MFA_ISSUER;
    delete process.env.AUTH_COOKIE_SAME_SITE;
    delete process.env.AUTH_COOKIE_SECURE;
    delete process.env.AUTH_COOKIE_MAX_AGE_MS;
    delete process.env.PORT;
    delete process.env.COMPLIANCE_UPLOAD_MAX_BYTES;
    delete process.env.PO_DOCUMENT_UPLOAD_MAX_BYTES;
    delete process.env.FRONTEND_ORIGIN;
    delete process.env.S3_REGION;
    delete process.env.S3_ACCESS_KEY;
    delete process.env.S3_SECRET_KEY;
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_BUCKET;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.AT_USERNAME;
    delete process.env.AT_API_KEY;
    delete process.env.ENABLE_SUPPLY_CHAIN;
    delete process.env.ENABLE_PPM;
    delete process.env.ENABLE_ANALYTICS;
    delete process.env.ENABLE_HSTS;
    delete process.env.REQUIRED_MFA_ROLES;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('accepts a minimal valid environment', () => {
    expect(() => validateEnvironment()).not.toThrow();
  });

  it('rejects invalid same-site cookie values', () => {
    process.env.AUTH_COOKIE_SAME_SITE = 'invalid';

    expect(() => validateEnvironment()).toThrow(
      'AUTH_COOKIE_SAME_SITE must be one of: lax, strict, none.',
    );
  });

  it('rejects insecure none same-site cookies', () => {
    process.env.AUTH_COOKIE_SAME_SITE = 'none';
    process.env.AUTH_COOKIE_SECURE = 'false';

    expect(() => validateEnvironment()).toThrow(
      'AUTH_COOKIE_SECURE cannot be false when AUTH_COOKIE_SAME_SITE is "none".',
    );
  });

  it('rejects invalid frontend origin lists', () => {
    process.env.FRONTEND_ORIGIN = 'not-a-url';

    expect(() => validateEnvironment()).toThrow(
      'FRONTEND_ORIGIN contains an invalid origin: not-a-url',
    );
  });

  it('rejects partial S3 configuration', () => {
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_ACCESS_KEY = 'key';

    expect(() => validateEnvironment()).toThrow(
      'S3 storage configuration is incomplete. Missing: S3_SECRET_KEY, S3_ENDPOINT, S3_BUCKET.',
    );
  });

  it('rejects invalid feature flag values', () => {
    process.env.ENABLE_PPM = 'maybe';

    expect(() => validateEnvironment()).toThrow(
      'ENABLE_PPM must be one of: true, false, 1, 0, yes, no.',
    );
  });

  it('rejects invalid HSTS values', () => {
    process.env.ENABLE_HSTS = 'maybe';

    expect(() => validateEnvironment()).toThrow(
      'ENABLE_HSTS must be one of: true, false, 1, 0, yes, no.',
    );
  });

  it('rejects empty required MFA role lists', () => {
    process.env.REQUIRED_MFA_ROLES = ' , ';

    expect(() => validateEnvironment()).toThrow(
      'REQUIRED_MFA_ROLES must contain at least one role when set.',
    );
  });

  it('rejects invalid upload size limits', () => {
    process.env.PO_DOCUMENT_UPLOAD_MAX_BYTES = '-1';

    expect(() => validateEnvironment()).toThrow(
      'PO_DOCUMENT_UPLOAD_MAX_BYTES must be a positive integer when set.',
    );
  });
});
