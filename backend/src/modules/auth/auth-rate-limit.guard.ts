import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AUTH_RATE_LIMIT_METADATA_KEY,
  AuthRateLimitOptions,
} from './auth-rate-limit.decorator';

type AttemptWindow = {
  count: number;
  expiresAt: number;
};

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, AttemptWindow>();
  private readonly logger = new Logger(AuthRateLimitGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const config = this.reflector.get<AuthRateLimitOptions>(
      AUTH_RATE_LIMIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const now = Date.now();
    const key = this.buildKey(request, config);
    const current = this.attempts.get(key);

    if (!current || current.expiresAt <= now) {
      this.attempts.set(key, {
        count: 1,
        expiresAt: now + config.windowMs,
      });
      this.cleanupExpiredEntries(now);
      return true;
    }

    if (current.count >= config.limit) {
      this.logger.warn(
        JSON.stringify({
          event: 'auth.rate_limit.hit',
          key: config.key,
          ipAddress: this.getClientIp(request),
          requestPath: request.path,
        }),
      );
      throw new HttpException(
        'Too many authentication attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    this.attempts.set(key, current);
    this.cleanupExpiredEntries(now);
    return true;
  }

  private buildKey(request: any, config: AuthRateLimitOptions) {
    const clientIp = this.getClientIp(request);
    const body = request.body && typeof request.body === 'object' ? request.body : {};
    const scopedBodyValues = (config.bodyFields || [])
      .map((field) => body[field])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim().toLowerCase());

    return [config.key, clientIp, ...scopedBodyValues].join('|');
  }

  private getClientIp(request: any) {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0].trim();
    }

    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  private cleanupExpiredEntries(now: number) {
    if (this.attempts.size <= 500) {
      return;
    }

    for (const [key, value] of this.attempts.entries()) {
      if (value.expiresAt <= now) {
        this.attempts.delete(key);
      }
    }
  }
}
