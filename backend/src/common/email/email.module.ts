import { Module, Global, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailIntegrationService } from './email-integration.service';
import { IntegrationsEmailController } from './integrations-email.controller';
import { EmailTrackingController } from './email-tracking.controller';
import { EmailTemplateController } from './email-template.controller';
import { EmailSequenceController } from './email-sequence.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { JobsModule } from '../../jobs/jobs.module';

@Global()
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    forwardRef(() => JobsModule),
  ],
  controllers: [
    IntegrationsEmailController,
    EmailTrackingController,
    EmailTemplateController,
    EmailSequenceController,
  ],
  providers: [
    EmailService,
    EmailIntegrationService,
  ],
  exports: [
    EmailService,
    EmailIntegrationService,
  ],
})
export class EmailModule {}
