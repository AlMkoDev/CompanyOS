const VALID_SAME_SITE_VALUES = new Set(['lax', 'strict', 'none']);

function parseOptionalBoolean(value: string | undefined, key: string) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new Error(`${key} must be either "true" or "false" when set.`);
}

function parsePositiveInteger(value: string | undefined, key: string) {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer when set.`);
  }

  return parsed;
}

function validateOriginList(originsValue: string | undefined) {
  if (!originsValue || originsValue.trim() === '') {
    return;
  }

  const origins = originsValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error('FRONTEND_ORIGIN must contain at least one origin when set.');
  }

  origins.forEach((origin) => {
    try {
      const parsed = new URL(origin);
      if (!parsed.protocol || !parsed.host) {
        throw new Error();
      }
    } catch {
      throw new Error(`FRONTEND_ORIGIN contains an invalid origin: ${origin}`);
    }
  });
}

function hasAnyConfigured(keys: string[]) {
  return keys.some((key) => {
    const value = process.env[key];
    return value !== undefined && value.trim() !== '';
  });
}

function requireAllOrNone(keys: string[], label: string) {
  const configured = keys.filter((key) => {
    const value = process.env[key];
    return value !== undefined && value.trim() !== '';
  });

  if (configured.length > 0 && configured.length !== keys.length) {
    const missing = keys.filter((key) => !configured.includes(key));
    throw new Error(
      `${label} configuration is incomplete. Missing: ${missing.join(', ')}.`,
    );
  }
}

function validateOptionalBooleanEnv(key: string) {
  const value = process.env[key];

  if (value === undefined || value.trim() === '') {
    return;
  }

  const normalized = value.trim().toLowerCase();
  if (!['true', 'false', '1', '0', 'yes', 'no'].includes(normalized)) {
    throw new Error(`${key} must be one of: true, false, 1, 0, yes, no.`);
  }
}

function validateOptionalRoleListEnv(key: string) {
  const value = process.env[key];

  if (value === undefined || value.trim() === '') {
    return;
  }

  const roles = value
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);

  if (roles.length === 0) {
    throw new Error(`${key} must contain at least one role when set.`);
  }
}

export function validateEnvironment() {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    throw new Error('JWT_SECRET must be set before starting the backend.');
  }

  const cookieName = process.env.AUTH_COOKIE_NAME?.trim();
  if (cookieName !== undefined && cookieName.length === 0) {
    throw new Error('AUTH_COOKIE_NAME cannot be empty when set.');
  }

  const mfaIssuer = process.env.MFA_ISSUER?.trim();
  if (mfaIssuer !== undefined && mfaIssuer.length === 0) {
    throw new Error('MFA_ISSUER cannot be empty when set.');
  }

  const sameSite = process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase();
  if (sameSite && !VALID_SAME_SITE_VALUES.has(sameSite)) {
    throw new Error('AUTH_COOKIE_SAME_SITE must be one of: lax, strict, none.');
  }

  const secure = parseOptionalBoolean(process.env.AUTH_COOKIE_SECURE, 'AUTH_COOKIE_SECURE');
  const effectiveSameSite = sameSite || 'lax';
  if (effectiveSameSite === 'none' && secure === false) {
    throw new Error('AUTH_COOKIE_SECURE cannot be false when AUTH_COOKIE_SAME_SITE is "none".');
  }

  parsePositiveInteger(process.env.AUTH_COOKIE_MAX_AGE_MS, 'AUTH_COOKIE_MAX_AGE_MS');
  parsePositiveInteger(process.env.PORT, 'PORT');
  parsePositiveInteger(process.env.COMPLIANCE_UPLOAD_MAX_BYTES, 'COMPLIANCE_UPLOAD_MAX_BYTES');
  parsePositiveInteger(process.env.PO_DOCUMENT_UPLOAD_MAX_BYTES, 'PO_DOCUMENT_UPLOAD_MAX_BYTES');

  validateOriginList(process.env.FRONTEND_ORIGIN);

  requireAllOrNone(
    ['S3_REGION', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_ENDPOINT', 'S3_BUCKET'],
    'S3 storage',
  );

  requireAllOrNone(
    ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'],
    'SMTP',
  );

  requireAllOrNone(['AT_USERNAME', 'AT_API_KEY'], 'Africa\'s Talking');

  if (hasAnyConfigured(['SMTP_PORT'])) {
    parsePositiveInteger(process.env.SMTP_PORT, 'SMTP_PORT');
  }

  validateOptionalBooleanEnv('ENABLE_SUPPLY_CHAIN');
  validateOptionalBooleanEnv('ENABLE_PPM');
  validateOptionalBooleanEnv('ENABLE_ANALYTICS');
  validateOptionalBooleanEnv('ENABLE_HSTS');
  validateOptionalBooleanEnv('ENABLE_SWAGGER');
  validateOptionalRoleListEnv('REQUIRED_MFA_ROLES');
}
