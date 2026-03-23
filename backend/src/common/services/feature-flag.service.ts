import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getFeatureFlagValue } from '../env';

export enum FeatureFlag {
  ENABLE_SUPPLY_CHAIN = 'ENABLE_SUPPLY_CHAIN',
  ENABLE_PPM = 'ENABLE_PPM',
  ENABLE_ANALYTICS = 'ENABLE_ANALYTICS',
}

@Injectable()
export class FeatureFlagService {
  constructor(private configService: ConfigService) {}

  /**
   * Check if a feature flag is enabled
   * @param flag The feature flag to check
   * @returns true if enabled, false if disabled
   */
  isEnabled(flag: FeatureFlag): boolean {
    const value = this.configService.get<string>(flag);
    
    // Default to false for security (features disabled by default)
    if (!value) {
      return false;
    }

    return getFeatureFlagValue(flag);
  }

  /**
   * Check if Supply Chain module is enabled
   */
  isSupplyChainEnabled(): boolean {
    return this.isEnabled(FeatureFlag.ENABLE_SUPPLY_CHAIN);
  }

  /**
   * Check if PPM module is enabled
   */
  isPPMEnabled(): boolean {
    return this.isEnabled(FeatureFlag.ENABLE_PPM);
  }

  /**
   * Check if Analytics module is enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled(FeatureFlag.ENABLE_ANALYTICS);
  }

  /**
   * Get all feature flag statuses
   */
  getAllFlags(): Record<string, boolean> {
    return {
      [FeatureFlag.ENABLE_SUPPLY_CHAIN]: this.isSupplyChainEnabled(),
      [FeatureFlag.ENABLE_PPM]: this.isPPMEnabled(),
      [FeatureFlag.ENABLE_ANALYTICS]: this.isAnalyticsEnabled(),
    };
  }

  /**
   * Validate that required flags are enabled for a feature
   * @param requiredFlags Array of flags that must be enabled
   * @throws Error if any required flag is disabled
   */
  validateRequiredFlags(requiredFlags: FeatureFlag[]): void {
    const disabledFlags = requiredFlags.filter(flag => !this.isEnabled(flag));
    
    if (disabledFlags.length > 0) {
      throw new Error(
        `Required feature flags are disabled: ${disabledFlags.join(', ')}`
      );
    }
  }
}
