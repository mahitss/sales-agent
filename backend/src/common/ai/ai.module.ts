import { Module } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [OpenRouterService],
  exports: [OpenRouterService],
})
export class AIModule {}
