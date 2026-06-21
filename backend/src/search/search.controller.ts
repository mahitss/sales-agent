import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '../auth/auth.guard';
import { TenantGuard } from '../auth/tenant.guard';

@Controller('search')
@UseGuards(AuthGuard, TenantGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(
    @Query('businessId') businessId: string,
    @Query('q') query: string,
  ) {
    if (!businessId) {
      throw new BadRequestException('Missing required parameter: businessId');
    }
    
    return this.searchService.searchAll(businessId, query || '');
  }
}
