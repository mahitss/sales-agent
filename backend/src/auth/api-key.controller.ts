import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { AuthGuard } from './auth.guard';

@UseGuards(AuthGuard)
@Controller('auth/apikeys')
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Post()
  async create(
    @Req() req,
    @Body() body: { name: string; role?: string; expiresDays?: number }
  ) {
    if (!req.user.businessId) {
      throw new BadRequestException('User is not associated with a business workspace');
    }
    // Enforce ADMIN privileges to create developer keys
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only workspace administrators can create developer keys');
    }
    if (!body.name) {
      throw new BadRequestException('API key name is required');
    }
    return this.apiKeyService.createApiKey(
      req.user.businessId,
      body.name,
      body.role || 'EMPLOYEE',
      body.expiresDays
    );
  }

  @Get()
  async list(@Req() req) {
    if (!req.user.businessId) {
      throw new BadRequestException('User is not associated with a business workspace');
    }
    return this.apiKeyService.listApiKeys(req.user.businessId);
  }

  @Delete(':id')
  async revoke(@Param('id') id: string, @Req() req) {
    if (!req.user.businessId) {
      throw new BadRequestException('User is not associated with a business workspace');
    }
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only workspace administrators can revoke developer keys');
    }
    return this.apiKeyService.revokeApiKey(req.user.businessId, id);
  }
}
