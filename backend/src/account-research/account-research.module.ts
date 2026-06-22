import { Module, forwardRef } from '@nestjs/common';
import { AccountResearchService } from './account-research.service';
import { AccountResearchController } from './account-research.controller';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [forwardRef(() => JobsModule)],
  providers: [AccountResearchService],
  controllers: [AccountResearchController],
  exports: [AccountResearchService],
})
export class AccountResearchModule {}

