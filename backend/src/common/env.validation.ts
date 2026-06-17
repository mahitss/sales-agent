import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, validateSync, IsEnum, IsNumber, IsOptional } from 'class-validator';

class EnvironmentVariables {
  @IsEnum(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsNumber()
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error('Environment variable validation failed:\n' + errors.toString());
  }
  return validatedConfig;
}
