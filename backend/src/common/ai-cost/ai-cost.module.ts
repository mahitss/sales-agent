import { Module } from '@nestjs/common';
import { AICostService } from './ai-cost.service';
import { AICostController } from './ai-cost.controller';

@Module({
  providers: [AICostService],
  controllers: [AICostController],
  exports: [AICostService],
})
export class AICostModule {}
