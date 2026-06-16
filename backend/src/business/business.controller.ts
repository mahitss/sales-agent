import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto, CreateFAQDto } from './dto/business.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async create(@Request() req, @Body() dto: CreateBusinessDto) {
    return this.businessService.create(req.user.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getForUser(@Request() req) {
    return this.businessService.getForUser(req.user.sub, req.user.role);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.businessService.getById(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put(':id')
  async update(@Param('id') id: string, @Request() req, @Body() dto: CreateBusinessDto) {
    return this.businessService.update(id, req.user.sub, dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/faq')
  async createFAQ(@Param('id') id: string, @Request() req, @Body() dto: CreateFAQDto) {
    return this.businessService.createFAQ(id, req.user.sub, dto);
  }

  @Get(':id/faq')
  async getFAQs(@Param('id') id: string) {
    return this.businessService.getFAQs(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('faq/:faqId')
  async deleteFAQ(@Param('faqId') faqId: string, @Request() req) {
    return this.businessService.deleteFAQ(faqId, req.user.sub);
  }

  // --- Visitor Tracking Endpoints ---
  @Post(':id/track-visitor')
  async trackVisitor(
    @Param('id') id: string,
    @Body() body: { location: string; pagesViewed: string[]; duration: number }
  ) {
    return this.businessService.trackVisitor(id, body);
  }

  @UseGuards(AuthGuard)
  @Get(':id/visitor-tracks')
  async getVisitorTracks(@Param('id') id: string) {
    return this.businessService.getVisitorTracks(id);
  }

  // --- Auto Scraper / Web Learning Endpoint ---
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/scrape')
  async scrapeWebsite(@Param('id') id: string, @Body('url') url: string) {
    return this.businessService.scrapeWebsite(id, url);
  }

  // --- Document Import / Learn Text ---
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/import-text')
  async importText(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { title: string; text: string }
  ) {
    return this.businessService.importText(id, req.user.sub, body);
  }

  // --- Competitor Analysis Endpoints ---
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/competitor-analysis')
  async competitorAnalysis(@Param('id') id: string, @Body('competitorUrl') competitorUrl: string) {
    return this.businessService.competitorAnalysis(id, competitorUrl);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/competitor-analysis')
  async getCompetitorAnalyses(@Param('id') id: string) {
    return this.businessService.getCompetitorAnalyses(id);
  }

  // --- Recommendations Endpoint ---
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/recommendations')
  async getRecommendations(@Param('id') id: string) {
    return this.businessService.getRecommendations(id);
  }

  // --- Team Seat / Invited Employees Management ---
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/employees')
  async createEmployee(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { email: string; name: string; password?: string }
  ) {
    return this.businessService.createEmployee(id, req.user.sub, body);
  }

  @UseGuards(AuthGuard)
  @Get(':id/employees')
  async getEmployees(@Param('id') id: string, @Request() req) {
    return this.businessService.getEmployees(id, req.user.sub, req.user.role);
  }
}
