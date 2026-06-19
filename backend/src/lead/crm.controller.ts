import { Controller, Get, Post, Put, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('crm')
@UseGuards(AuthGuard)
export class CRMController {
  constructor(private prisma: PrismaService) {}

  /**
   * List scheduled email outreach sequences for a business.
   */
  @Get('business/:businessId/outreach')
  async getOutreachSequences(@Param('businessId') businessId: string) {
    return this.prisma.outreachSequence.findMany({
      where: {
        lead: { businessId },
      },
      include: {
        lead: {
          select: {
            name: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  /**
   * Schedule email outreach sequence.
   */
  @Post('business/:businessId/outreach')
  async scheduleOutreach(
    @Body() body: { leadId: string; template: string; subject: string; bodyText: string; delayMinutes?: number }
  ) {
    if (!body.leadId || !body.template || !body.subject || !body.bodyText) {
      throw new BadRequestException('Missing parameters: leadId, template, subject, bodyText');
    }

    const delay = body.delayMinutes || 10;
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + delay);

    return this.prisma.outreachSequence.create({
      data: {
        leadId: body.leadId,
        template: body.template,
        subject: body.subject,
        body: body.bodyText,
        status: 'SCHEDULED',
        scheduledFor: scheduledTime,
      },
    });
  }

  /**
   * Get all workflow automation rules for a business.
   */
  @Get('business/:businessId/workflow-rules')
  async getWorkflowRules(@Param('businessId') businessId: string) {
    // Seed default rules if none exist yet
    const existing = await this.prisma.workflowRule.findMany({
      where: { businessId },
    });

    if (existing.length === 0) {
      const defaults = [
        { trigger: 'STATUS_HOT', action: 'EMAIL_OUTREACH', isEnabled: true },
        { trigger: 'STATUS_HOT', action: 'SHEET_SYNC', isEnabled: true },
        { trigger: 'NEW_LEAD', action: 'GOOGLE_SHEETS_SYNC', isEnabled: false },
      ];
      await this.prisma.workflowRule.createMany({
        data: defaults.map(d => ({ ...d, businessId })),
      });
      return this.prisma.workflowRule.findMany({
        where: { businessId },
      });
    }

    return existing;
  }

  /**
   * Toggle or update a workflow automation rule.
   */
  @Put('workflow-rules/:ruleId')
  async toggleWorkflowRule(
    @Param('ruleId') ruleId: string,
    @Body('isEnabled') isEnabled: boolean
  ) {
    return this.prisma.workflowRule.update({
      where: { id: ruleId },
      data: { isEnabled },
    });
  }

  /**
   * Lead Enrichment - Company intelligence search simulation
   */
  @Post('company/enrich')
  async enrichCompany(
    @Body() body: { leadId: string; domain: string }
  ) {
    if (!body.leadId || !body.domain) {
      throw new BadRequestException('Missing leadId or domain name.');
    }

    // Check if CompanyEnrichment already exists for lead
    const existing = await this.prisma.companyEnrichment.findUnique({
      where: { leadId: body.leadId },
    });

    const mockEnrichedData = {
      companyName: body.domain.split('.')[0].toUpperCase(),
      domain: body.domain,
      headquarters: 'Bengaluru, India',
      employees: '50-200',
      revenue: '$5M - $10M',
      techStack: 'React, TailwindCSS, NestJS, PostgreSQL, Redis, OpenAI, Google Analytics',
      industry: 'SaaS Software & AI Automation Solutions',
      socialLinks: {
        linkedin: `https://linkedin.com/company/${body.domain.split('.')[0]}`,
        twitter: `https://twitter.com/${body.domain.split('.')[0]}`,
      },
    };

    if (existing) {
      return this.prisma.companyEnrichment.update({
        where: { id: existing.id },
        data: {
          companyName: mockEnrichedData.companyName,
          website: mockEnrichedData.domain,
          country: 'India',
          industry: mockEnrichedData.industry,
          companySize: mockEnrichedData.employees,
          description: mockEnrichedData.revenue,
          socialLinks: mockEnrichedData.socialLinks,
        },
      });
    }

    return this.prisma.companyEnrichment.create({
      data: {
        leadId: body.leadId,
        companyName: mockEnrichedData.companyName,
        website: mockEnrichedData.domain,
        country: 'India',
        industry: mockEnrichedData.industry,
        companySize: mockEnrichedData.employees,
        description: mockEnrichedData.revenue,
        socialLinks: mockEnrichedData.socialLinks,
      },
    });
  }

  /**
   * Email Finder - Find corporate contact emails for a target domain
   */
  @Post('company/email-finder')
  async findCompanyEmails(
    @Body() body: { domain: string }
  ) {
    if (!body.domain) {
      throw new BadRequestException('Missing company domain name.');
    }

    const domainName = body.domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const prefix = domainName.split('.')[0];

    // Return mock verified contacts from directory
    return {
      domain: domainName,
      contacts: [
        { name: 'John Doe', email: `john.doe@${domainName}`, role: 'Founder & CEO', confidence: 98 },
        { name: 'Sarah Smith', email: `sarah.s@${domainName}`, role: 'Head of Sales', confidence: 95 },
        { name: 'David Lee', email: `d.lee@${domainName}`, role: 'CTO', confidence: 91 },
      ],
    };
  }
}
