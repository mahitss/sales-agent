import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as LDClient from '@launchdarkly/node-server-sdk';

@Injectable()
export class FeatureFlagService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FeatureFlagService.name);
  private ldClient: LDClient.LDClient | null = null;
  private useLaunchDarkly = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const sdkKey = this.configService.get<string>('LAUNCHDARKLY_SDK_KEY');
    if (sdkKey) {
      try {
        this.ldClient = LDClient.init(sdkKey);
        await this.ldClient.waitForInitialization({ timeout: 5000 });
        this.useLaunchDarkly = true;
        this.logger.log('LaunchDarkly SDK initialized successfully');
      } catch (err: any) {
        this.logger.error(`LaunchDarkly initialization failed: ${err.message}. Falling back to env flags.`);
        this.useLaunchDarkly = false;
      }
    } else {
      this.logger.log('No LAUNCHDARKLY_SDK_KEY found. Using local environment-based feature flags.');
    }
  }

  async onModuleDestroy() {
    if (this.ldClient) {
      await this.ldClient.close();
      this.logger.log('LaunchDarkly client closed');
    }
  }

  async getBoolFlag(flagKey: string, userKey: string, defaultValue = false): Promise<boolean> {
    if (this.useLaunchDarkly && this.ldClient) {
      const context = { key: userKey || 'anonymous-user', kind: 'user' };
      return this.ldClient.variation(flagKey, context, defaultValue);
    }
    // Fallback to Env variable check (e.g. FEATURE_FLAG_EMAIL_VERIFICATION)
    const envKey = `FEATURE_FLAG_${flagKey.toUpperCase().replace(/[-\s]/g, '_')}`;
    const envVal = this.configService.get<string>(envKey);
    if (envVal !== undefined) {
      return envVal === 'true';
    }
    return defaultValue;
  }
}
