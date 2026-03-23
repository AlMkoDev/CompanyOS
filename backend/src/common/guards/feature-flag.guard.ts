import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService, FeatureFlag } from '../services/feature-flag.service';

export const FEATURE_FLAG_KEY = 'feature_flags';

/**
 * Decorator to require specific feature flags to be enabled
 * @param flags Array of feature flags that must be enabled
 */
export const RequireFeatureFlags = (...flags: FeatureFlag[]) =>
  SetMetadata(FEATURE_FLAG_KEY, flags);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagService: FeatureFlagService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFlags = this.reflector.getAllAndOverride<FeatureFlag[]>(
      FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no feature flags are required, allow access
    if (!requiredFlags || requiredFlags.length === 0) {
      return true;
    }

    // Check if all required flags are enabled
    const disabledFlags = requiredFlags.filter(
      flag => !this.featureFlagService.isEnabled(flag)
    );

    if (disabledFlags.length > 0) {
      // Return 404 to make the feature completely invisible
      throw new NotFoundException('Resource not found');
    }

    return true;
  }
}