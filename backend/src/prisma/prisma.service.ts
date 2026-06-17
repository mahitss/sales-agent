import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { dbQueryCounter } from '../metrics/metrics.controller';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    
    this.$use(async (params, next) => {
      dbQueryCounter.inc();
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
