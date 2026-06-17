import { Module, forwardRef } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { QueueModule } from '../common/queues/queue.module';

@Module({
  imports: [forwardRef(() => QueueModule)],
  providers: [BusinessService],
  controllers: [BusinessController],
  exports: [BusinessService],
})
export class BusinessModule {}
