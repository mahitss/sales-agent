import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AICostService } from './ai-cost.service';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('business')
export class AICostController {
  constructor(private aiCostService: AICostService) {}

  @UseGuards(AuthGuard)
  @Get(':businessId/ai-usage')
  async getCostStats(@Param('businessId') businessId: string) {
    return this.aiCostService.getCostStats(businessId);
  }
}
