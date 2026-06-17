import { Module, Global, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BusinessModule } from '../../business/business.module';

@Global()
@Module({
  imports: [forwardRef(() => BusinessModule)],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
