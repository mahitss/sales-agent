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
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from './common/redis/redis.module';
import { validate } from './common/env.validation';

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
    PrismaModule,
    AuthModule,
    BusinessModule,
    LeadModule,
    AppointmentModule,
    ConversationModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimiterMiddleware)
      .exclude(
        { path: 'logicra-widget.js', method: RequestMethod.GET },
        { path: 'logicra-widget.min.js', method: RequestMethod.GET },
        { path: 'widget-assets/(.*)', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}

