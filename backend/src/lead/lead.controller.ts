import { Controller, Post, Get, Put, Body, Param, UseGuards, Res } from '@nestjs/common';
import { LeadService } from './lead.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import * as express from 'express';

@Controller('leads')
export class LeadController {
  constructor(private leadService: LeadService) {}

  @Post()
  async create(@Body() dto: CreateLeadDto) {
    return this.leadService.create(dto);
  }

  @UseGuards(AuthGuard)
  @Get('business/:businessId')
  async getByBusiness(@Param('businessId') businessId: string) {
    return this.leadService.getByBusiness(businessId);
  }

  @UseGuards(AuthGuard)
  @Get('stats/:businessId')
  async getStats(@Param('businessId') businessId: string) {
    return this.leadService.getStats(businessId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('business/:businessId/export')
  async exportLeads(@Param('businessId') businessId: string, @Res() res: express.Response) {
    const csv = await this.leadService.exportLeadsToCsv(businessId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads-${businessId}.csv`);
    return res.status(200).send(csv);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.leadService.getById(id);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadService.update(id, dto);
  }
}
