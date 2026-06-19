import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { LeadModule } from './lead/lead.module';
import { AppointmentModule } from './appointment/appointment.module';
import { ConversationModule } from './conversation/conversation.module';
import { ChatModule } from './chat/chat.module';
import { RateLimiterMiddleware } from './common/middleware/rate-limiter.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from './common/redis/redis.module';
import { EmailModule } from './common/email/email.module';
import { QueueModule } from './common/queues/queue.module';
import { FeatureFlagModule } from './common/feature-flags/feature-flag.module';
import { validate } from './common/env.validation';
import { StripeModule } from './common/stripe/stripe.module';
import { ActivityLogModule } from './common/activity-logs/activity-log.module';
import { AICostModule } from './common/ai-cost/ai-cost.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // General high rate limit for app routes
    }]),
    RedisModule,
    EmailModule,
    QueueModule,
    FeatureFlagModule,
    PrismaModule,
    AuthModule,
    BusinessModule,
    LeadModule,
    AppointmentModule,
    ConversationModule,
    ChatModule,
    StripeModule,
    ActivityLogModule,
    AICostModule,
  ],
  controllers: [AppController, HealthController, MetricsController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware, RateLimiterMiddleware, CsrfMiddleware)
      .exclude(
        { path: 'logicra-widget.js', method: RequestMethod.GET },
        { path: 'logicra-widget.min.js', method: RequestMethod.GET },
        { path: 'widget-assets/(.*)', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}

