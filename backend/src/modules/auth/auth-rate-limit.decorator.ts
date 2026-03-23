import { SetMetadata } from '@nestjs/common';

export const AUTH_RATE_LIMIT_METADATA_KEY = 'authRateLimit';

export type AuthRateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  bodyFields?: string[];
};

export const AuthRateLimit = (options: AuthRateLimitOptions) =>
  SetMetadata(AUTH_RATE_LIMIT_METADATA_KEY, options);
