import { Module } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ActivityLogService, AuditLogInterceptor],
  controllers: [ActivityLogController],
  exports: [ActivityLogService, AuditLogInterceptor],
})
export class ActivityLogModule {}
