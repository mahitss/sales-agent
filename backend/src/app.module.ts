import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { JobsModule } from './jobs/jobs.module';
import { AccountResearchModule } from './account-research/account-research.module';
import { WorkflowModule } from './workflow/workflow.module';
import { FeatureFlagModule } from './common/feature-flags/feature-flag.module';
import { validate } from './common/env.validation';
import { StripeModule } from './common/stripe/stripe.module';
import { ActivityLogModule } from './common/activity-logs/activity-log.module';
import { AuditLogInterceptor } from './common/activity-logs/audit-log.interceptor';
import { AICostModule } from './common/ai-cost/ai-cost.module';
import { WebhookSubscriptionModule } from './common/webhooks/webhook-subscription.module';

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
    JobsModule,
    AccountResearchModule,
    WorkflowModule,
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
    WebhookSubscriptionModule,
  ],
  controllers: [AppController, HealthController, MetricsController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
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

