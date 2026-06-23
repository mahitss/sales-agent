import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  validateSync,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUrl,
} from 'class-validator';

class EnvironmentVariables {
  @IsEnum(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsNumber()
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  FRONTEND_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION: string = '7d';

  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsNumber()
  @IsOptional()
  REDIS_PORT?: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      'Environment variable validation failed:\n' + errors.toString(),
    );
  }

  // Prevent accidental localhost links in production
  if (validatedConfig.NODE_ENV === 'production' && validatedConfig.FRONTEND_URL) {
    const urlStr = validatedConfig.FRONTEND_URL.toLowerCase();
    if (urlStr.includes('localhost') || urlStr.includes('127.0.0.1')) {
      throw new Error(
        'FRONTEND_URL cannot point to localhost/127.0.0.1 in production environments!'
      );
    }
  }

  return validatedConfig;
}
