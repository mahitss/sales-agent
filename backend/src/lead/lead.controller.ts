import { Controller, Post, Get, Put, Body, Param, UseGuards, Res, Query } from '@nestjs/common';
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
  async getByBusiness(
    @Param('businessId') businessId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.leadService.getByBusiness(businessId, limitNum, cursor);
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

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('business/:businessId/export/json')
  async exportLeadsJson(@Param('businessId') businessId: string, @Res() res: express.Response) {
    const json = await this.leadService.exportLeadsToJson(businessId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=leads-${businessId}.json`);
    return res.status(200).send(json);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('business/:businessId/export/excel')
  async exportLeadsExcel(@Param('businessId') businessId: string, @Res() res: express.Response) {
    const buffer = await this.leadService.exportLeadsToExcel(businessId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=leads-${businessId}.xlsx`);
    return res.status(200).send(buffer);
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
