import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { ActivityLogModule } from '../common/activity-logs/activity-log.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret === 'super-secret-key-change-me-in-production') {
          if (process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: JWT_SECRET environment variable is required and cannot be default placeholder in production!');
          }
        }
        return secret || 'super-secret-key-change-me-in-production';
      })(),
      signOptions: { expiresIn: '1d' },
    }),
    ActivityLogModule,
  ],
  providers: [AuthService, ApiKeyService],
  controllers: [AuthController, ApiKeyController],
  exports: [AuthService, ApiKeyService],
})
export class AuthModule {}
