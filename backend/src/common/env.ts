export function getRequiredEnv(key: string) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} must be set before starting the backend.`);
  }

  return value;
}

export function getOptionalEnv(key: string) {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function getOptionalBooleanEnv(key: string) {
  const value = getOptionalEnv(key)?.toLowerCase();

  if (!value) {
    return undefined;
  }

  if (value === 'true' || value === '1' || value === 'yes') {
    return true;
  }

  if (value === 'false' || value === '0' || value === 'no') {
    return false;
  }

  throw new Error(`${key} must be a boolean-like value.`);
}

export function getOptionalPositiveIntegerEnv(key: string) {
  const value = getOptionalEnv(key);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return parsed;
}

export function getAuthCookieName() {
  return getOptionalEnv('AUTH_COOKIE_NAME') || 'companyos_auth';
}

export function getAuthCookieDomain() {
  return getOptionalEnv('AUTH_COOKIE_DOMAIN');
}

export function getAuthCookieSameSite() {
  const sameSite = getOptionalEnv('AUTH_COOKIE_SAME_SITE')?.toLowerCase();
  return sameSite === 'strict' || sameSite === 'none' ? sameSite : 'lax';
}

export function getAuthCookieSecure() {
  const sameSite = getAuthCookieSameSite();
  const configuredSecure = getOptionalEnv('AUTH_COOKIE_SECURE')?.toLowerCase();

  if (configuredSecure === 'true') {
    return true;
  }

  if (configuredSecure === 'false') {
    return sameSite === 'none';
  }

  return process.env.NODE_ENV === 'production' || sameSite === 'none';
}

export function getAuthCookieMaxAgeMs() {
  const rawMaxAge = getOptionalEnv('AUTH_COOKIE_MAX_AGE_MS');
  const parsedMaxAge = rawMaxAge ? Number(rawMaxAge) : NaN;
  return Number.isFinite(parsedMaxAge) && parsedMaxAge > 0
    ? parsedMaxAge
    : 30 * 60 * 1000;
}

export function getFrontendOrigins() {
  const configuredOrigins = getOptionalEnv('FRONTEND_ORIGIN')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins && configuredOrigins.length > 0
    ? configuredOrigins
    : ['http://localhost:3000'];
}

export function isAllowedFrontendOrigin(origin: string, configuredOrigins: string[]) {
  if (!origin) {
    return false;
  }

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  const originHost = parsedOrigin.hostname.toLowerCase();
  if (!originHost.endsWith('.vercel.app')) {
    return false;
  }

  return configuredOrigins.some((configuredOrigin) => {
    try {
      const parsedConfiguredOrigin = new URL(configuredOrigin);
      return parsedConfiguredOrigin.hostname.toLowerCase().endsWith('.vercel.app');
    } catch {
      return false;
    }
  });
}

export function getPort() {
  const rawPort = getOptionalEnv('PORT');
  const parsedPort = rawPort ? Number(rawPort) : NaN;
  return Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3001;
}

export function getJwtSecret() {
  return getRequiredEnv('JWT_SECRET');
}

export function getMfaIssuer() {
  return getOptionalEnv('MFA_ISSUER') || 'CompanyOS';
}

export function getRequiredMfaRoles() {
  const configured = getOptionalEnv('REQUIRED_MFA_ROLES');

  if (!configured) {
    return ['super admin', 'admin', 'owner'];
  }

  return configured
    .split(',')
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);
}

export function getComplianceUploadMaxBytes() {
  return getOptionalPositiveIntegerEnv('COMPLIANCE_UPLOAD_MAX_BYTES') || 10 * 1024 * 1024;
}

export function getPoDocumentUploadMaxBytes() {
  return getOptionalPositiveIntegerEnv('PO_DOCUMENT_UPLOAD_MAX_BYTES') || 10 * 1024 * 1024;
}

export function getEnableHsts() {
  return getOptionalBooleanEnv('ENABLE_HSTS') ?? false;
}

export function getEnableSwagger() {
  return getOptionalBooleanEnv('ENABLE_SWAGGER') ?? process.env.NODE_ENV !== 'production';
}

export function getS3Config() {
  const region = getOptionalEnv('S3_REGION');
  const accessKeyId = getOptionalEnv('S3_ACCESS_KEY');
  const secretAccessKey = getOptionalEnv('S3_SECRET_KEY');
  const endpoint = getOptionalEnv('S3_ENDPOINT');
  const bucket = getOptionalEnv('S3_BUCKET');

  if (region && accessKeyId && secretAccessKey && endpoint && bucket) {
    return {
      region,
      accessKeyId,
      secretAccessKey,
      endpoint: endpoint.replace(/\/+$/, ''),
      bucket,
    };
  }

  return null;
}

export function getSmtpConfig() {
  const host = getOptionalEnv('SMTP_HOST');
  const portValue = getOptionalEnv('SMTP_PORT');
  const user = getOptionalEnv('SMTP_USER');
  const pass = getOptionalEnv('SMTP_PASS');
  const from = getOptionalEnv('SMTP_FROM');

  if (host && portValue && user && pass && from) {
    return {
      host,
      port: Number(portValue),
      user,
      pass,
      from,
    };
  }

  return null;
}

export function getSmsConfig() {
  const username = getOptionalEnv('AT_USERNAME');
  const apiKey = getOptionalEnv('AT_API_KEY');

  if (username && apiKey) {
    return { username, apiKey };
  }

  return null;
}

export function getFeatureFlagValue(key: string) {
  return getOptionalBooleanEnv(key) ?? false;
}
