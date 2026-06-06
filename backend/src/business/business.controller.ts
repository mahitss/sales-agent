import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto, CreateFAQDto } from './dto/business.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Request() req, @Body() dto: CreateBusinessDto) {
    return this.businessService.create(req.user.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getForUser(@Request() req) {
    return this.businessService.getForUser(req.user.sub);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.businessService.getById(id);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Request() req, @Body() dto: CreateBusinessDto) {
    return this.businessService.update(id, req.user.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Post(':id/faq')
  async createFAQ(@Param('id') id: string, @Request() req, @Body() dto: CreateFAQDto) {
    return this.businessService.createFAQ(id, req.user.sub, dto);
  }

  @Get(':id/faq')
  async getFAQs(@Param('id') id: string) {
    return this.businessService.getFAQs(id);
  }

  @UseGuards(AuthGuard)
  @Delete('faq/:faqId')
  async deleteFAQ(@Param('faqId') faqId: string, @Request() req) {
    return this.businessService.deleteFAQ(faqId, req.user.sub);
  }
}
