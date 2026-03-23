import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureFlagService } from '../services/feature-flag.service';
import { JwtAuthGuard } from '../../modules/auth/jwt.strategy';

@ApiTags('feature-flags')
@ApiBearerAuth('JWT-auth')
@Controller('feature-flags')
@UseGuards(JwtAuthGuard)
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Get()
  @ApiOperation({ summary: 'Get all feature flag statuses' })
  @ApiResponse({ 
    status: 200, 
    description: 'Feature flag statuses',
    schema: {
      type: 'object',
      properties: {
        ENABLE_SUPPLY_CHAIN: { type: 'boolean' },
        ENABLE_PPM: { type: 'boolean' },
        ENABLE_ANALYTICS: { type: 'boolean' },
      },
    },
  })
  getFeatureFlags() {
    return {
      flags: this.featureFlagService.getAllFlags(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('supply-chain')
  @ApiOperation({ summary: 'Check if Supply Chain module is enabled' })
  @ApiResponse({ 
    status: 200, 
    description: 'Supply Chain module status',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        module: { type: 'string', example: 'supply-chain' },
      },
    },
  })
  getSupplyChainStatus() {
    return {
      enabled: this.featureFlagService.isSupplyChainEnabled(),
      module: 'supply-chain',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ppm')
  @ApiOperation({ summary: 'Check if PPM module is enabled' })
  @ApiResponse({ 
    status: 200, 
    description: 'PPM module status',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        module: { type: 'string', example: 'ppm' },
      },
    },
  })
  getPPMStatus() {
    return {
      enabled: this.featureFlagService.isPPMEnabled(),
      module: 'ppm',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Check if Analytics module is enabled' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics module status',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        module: { type: 'string', example: 'analytics' },
      },
    },
  })
  getAnalyticsStatus() {
    return {
      enabled: this.featureFlagService.isAnalyticsEnabled(),
      module: 'analytics',
      timestamp: new Date().toISOString(),
    };
  }
}