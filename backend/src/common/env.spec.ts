import {
  getAuthCookieMaxAgeMs,
  getAuthCookieName,
  getAuthCookieSameSite,
  getAuthCookieSecure,
  getComplianceUploadMaxBytes,
  getEnableHsts,
  getFeatureFlagValue,
  getFrontendOrigins,
  getPoDocumentUploadMaxBytes,
  getRequiredMfaRoles,
  getOptionalBooleanEnv,
  getOptionalPositiveIntegerEnv,
  getPort,
  getS3Config,
  getSmtpConfig,
  getSmsConfig,
  isAllowedFrontendOrigin,
} from './env';

describe('env helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns default auth cookie values when unset', () => {
    delete process.env.AUTH_COOKIE_NAME;
    delete process.env.AUTH_COOKIE_SAME_SITE;
    delete process.env.AUTH_COOKIE_SECURE;
    delete process.env.AUTH_COOKIE_MAX_AGE_MS;

    expect(getAuthCookieName()).toBe('companyos_auth');
    expect(getAuthCookieSameSite()).toBe('lax');
    expect(getAuthCookieSecure()).toBe(false);
    expect(getAuthCookieMaxAgeMs()).toBe(30 * 60 * 1000);
  });

  it('forces secure cookies when sameSite is none', () => {
    process.env.AUTH_COOKIE_SAME_SITE = 'none';
    process.env.AUTH_COOKIE_SECURE = 'false';

    expect(getAuthCookieSecure()).toBe(true);
  });

  it('parses configured frontend origins and port', () => {
    process.env.FRONTEND_ORIGIN = 'http://localhost:3000, https://app.example.com';
    process.env.PORT = '4000';

    expect(getFrontendOrigins()).toEqual([
      'http://localhost:3000',
      'https://app.example.com',
    ]);
    expect(getPort()).toBe(4000);
  });

  it('allows vercel preview origins when a vercel frontend origin is configured', () => {
    const configuredOrigins = [
      'https://companyos-staging.vercel.app',
      'http://localhost:3000',
    ];

    expect(
      isAllowedFrontendOrigin(
        'https://companyos-staging-dvgoopdgg-allenplay4fan-7440s-projects.vercel.app',
        configuredOrigins,
      ),
    ).toBe(true);
    expect(
      isAllowedFrontendOrigin('https://malicious.example.com', configuredOrigins),
    ).toBe(false);
  });

  it('parses optional boolean values for feature flags', () => {
    process.env.ENABLE_SUPPLY_CHAIN = 'yes';
    process.env.ENABLE_PPM = '0';

    expect(getOptionalBooleanEnv('ENABLE_SUPPLY_CHAIN')).toBe(true);
    expect(getOptionalBooleanEnv('ENABLE_PPM')).toBe(false);
    expect(getFeatureFlagValue('ENABLE_SUPPLY_CHAIN')).toBe(true);
    expect(getFeatureFlagValue('ENABLE_PPM')).toBe(false);
  });

  it('returns default and configured required MFA roles', () => {
    delete process.env.REQUIRED_MFA_ROLES;
    expect(getRequiredMfaRoles()).toEqual(['super admin', 'admin', 'owner']);

    process.env.REQUIRED_MFA_ROLES = 'Super Admin, Finance Manager ,Owner';
    expect(getRequiredMfaRoles()).toEqual(['super admin', 'finance manager', 'owner']);
  });

  it('returns default and configured upload size limits', () => {
    delete process.env.COMPLIANCE_UPLOAD_MAX_BYTES;
    delete process.env.PO_DOCUMENT_UPLOAD_MAX_BYTES;

    expect(getComplianceUploadMaxBytes()).toBe(10 * 1024 * 1024);
    expect(getPoDocumentUploadMaxBytes()).toBe(10 * 1024 * 1024);

    process.env.COMPLIANCE_UPLOAD_MAX_BYTES = '2048';
    process.env.PO_DOCUMENT_UPLOAD_MAX_BYTES = '4096';

    expect(getComplianceUploadMaxBytes()).toBe(2048);
    expect(getPoDocumentUploadMaxBytes()).toBe(4096);
    expect(getOptionalPositiveIntegerEnv('COMPLIANCE_UPLOAD_MAX_BYTES')).toBe(2048);
  });

  it('returns default and configured HSTS enablement', () => {
    delete process.env.ENABLE_HSTS;
    expect(getEnableHsts()).toBe(false);

    process.env.ENABLE_HSTS = 'true';
    expect(getEnableHsts()).toBe(true);
  });

  it('returns null config objects when infra settings are absent', () => {
    delete process.env.S3_REGION;
    delete process.env.SMTP_HOST;
    delete process.env.AT_USERNAME;

    expect(getS3Config()).toBeNull();
    expect(getSmtpConfig()).toBeNull();
    expect(getSmsConfig()).toBeNull();
  });

  it('builds infra config objects when fully configured', () => {
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_ACCESS_KEY = 'key';
    process.env.S3_SECRET_KEY = 'secret';
    process.env.S3_ENDPOINT = 'https://storage.example.com/';
    process.env.S3_BUCKET = 'bucket';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'mailer';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_FROM = 'noreply@example.com';
    process.env.AT_USERNAME = 'sandbox';
    process.env.AT_API_KEY = 'key';

    expect(getS3Config()).toEqual({
      region: 'us-east-1',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      endpoint: 'https://storage.example.com',
      bucket: 'bucket',
    });
    expect(getSmtpConfig()).toEqual({
      host: 'smtp.example.com',
      port: 587,
      user: 'mailer',
      pass: 'pass',
      from: 'noreply@example.com',
    });
    expect(getSmsConfig()).toEqual({
      username: 'sandbox',
      apiKey: 'key',
    });
  });
});
