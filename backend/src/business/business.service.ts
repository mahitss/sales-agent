import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateBusinessDto, CreateFAQDto } from './dto/business.dto';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import sanitizeHtml from 'sanitize-html';
import { encrypt, decrypt } from '../common/utils/crypto.util';

@Injectable()
export class BusinessService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    @Inject(forwardRef(() => JobsService))
    private jobsService: JobsService,
  ) {}

  async create(ownerId: string, dto: CreateBusinessDto) {
    const business = await this.prisma.business.create({
      data: {
        ownerId,
        companyName: dto.companyName,
        website: dto.website,
        industry: dto.industry,
        description: dto.description,
        whatsappEnabled: dto.whatsappEnabled ?? false,
        instagramEnabled: dto.instagramEnabled ?? false,
        emailEnabled: dto.emailEnabled ?? false,
        whatsappApiKey: encrypt(dto.whatsappApiKey),
        instagramAccountId: dto.instagramAccountId,
        emailSmtp: encrypt(dto.emailSmtp),
        themeColor: dto.themeColor ?? '#10B981',
        agentTone: dto.agentTone ?? 'PROFESSIONAL',
        agentPrompt: dto.agentPrompt,
        widgetGreeting: dto.widgetGreeting ?? 'Hello! How can we help you today?',
        widgetRules: dto.widgetRules ?? '[]',
        widgetPosition: dto.widgetPosition ?? 'bottom-right',
        googleSheetsSpreadsheetId: dto.googleSheetsSpreadsheetId,
        googleSheetsEnabled: dto.googleSheetsEnabled ?? false,
      },
    });
    return this.decryptBusinessSecrets(business);
  }

  async getForUser(userId: string, role: string) {
    let business;
    if (role === 'ADMIN') {
      business = await this.prisma.business.findFirst({
        where: { ownerId: userId },
        include: { knowledgeBases: true, subscription: true },
      });
    } else {
      const employee = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (employee && employee.businessId) {
        business = await this.prisma.business.findUnique({
          where: { id: employee.businessId },
          include: { knowledgeBases: true, subscription: true },
        });
      }
    }
    if (!business) {
      return null;
    }
    return this.decryptBusinessSecrets(business);
  }

  async getById(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { knowledgeBases: true, subscription: true },
    });
    if (!business) {
      throw new NotFoundException('Business profile not found');
    }
    return this.decryptBusinessSecrets(business);
  }
  async update(businessId: string, ownerId: string, dto: CreateBusinessDto) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business not found or access denied');
    }

    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        companyName: dto.companyName,
        website: dto.website,
        industry: dto.industry,
        description: dto.description,
        whatsappEnabled: dto.whatsappEnabled ?? false,
        instagramEnabled: dto.instagramEnabled ?? false,
        emailEnabled: dto.emailEnabled ?? false,
        whatsappApiKey: encrypt(dto.whatsappApiKey),
        instagramAccountId: dto.instagramAccountId,
        emailSmtp: encrypt(dto.emailSmtp),
        themeColor: dto.themeColor ?? '#10B981',
        agentTone: dto.agentTone ?? 'PROFESSIONAL',
        agentPrompt: dto.agentPrompt,
        widgetGreeting: dto.widgetGreeting ?? 'Hello! How can we help you today?',
        widgetRules: dto.widgetRules ?? '[]',
        widgetPosition: dto.widgetPosition ?? 'bottom-right',
        googleSheetsSpreadsheetId: dto.googleSheetsSpreadsheetId,
        googleSheetsEnabled: dto.googleSheetsEnabled ?? false,
      },
    });

    try {
      await this.redisService.del(`business:${businessId}:public`);
    } catch (err) {
      // Ignore cache errors
    }

    return this.decryptBusinessSecrets(updated);
  }

  private decryptBusinessSecrets(business: any) {
    if (business) {
      business.whatsappApiKey = decrypt(business.whatsappApiKey);
      business.emailSmtp = decrypt(business.emailSmtp);
    }
    return business;
  }

  private sanitizeHtml(text: string): string {
    if (!text) return '';
    return sanitizeHtml(text, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['class', 'style', 'id'],
      },
    });
  }

  async createFAQ(businessId: string, ownerId: string, dto: CreateFAQDto) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business not found or access denied');
    }

    const created = await this.prisma.knowledgeBase.create({
      data: {
        businessId,
        title: this.sanitizeHtml(dto.title),
        content: this.sanitizeHtml(dto.content),
      },
    });

    await this.redisService.del(`business:${businessId}:faqs`).catch(() => {});
    return created;
  }

  async getFAQs(businessId: string) {
    const cacheKey = `business:${businessId}:faqs`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // Ignore cache errors
    }

    const faqs = await this.prisma.knowledgeBase.findMany({
      where: { businessId },
    });

    try {
      await this.redisService.set(cacheKey, JSON.stringify(faqs), 3600); // 1 hour TTL
    } catch (err) {
      // Ignore cache errors
    }

    return faqs;
  }

  async deleteFAQ(faqId: string, ownerId: string) {
    const faq = await this.prisma.knowledgeBase.findUnique({
      where: { id: faqId },
      include: { business: true },
    });
    if (!faq || faq.business.ownerId !== ownerId) {
      throw new NotFoundException('FAQ not found or access denied');
    }

    await this.prisma.knowledgeBase.delete({
      where: { id: faqId },
    });

    await this.redisService.del(`business:${faq.businessId}:faqs`).catch(() => {});
    return { success: true };
  }

  // --- Visitor Tracking Service ---
  async trackVisitor(businessId: string, data: { location: string; pagesViewed: string[]; duration: number }) {
    return this.prisma.visitorTrack.create({
      data: {
        businessId,
        location: data.location || 'Unknown',
        pagesViewed: JSON.stringify(data.pagesViewed || []),
        duration: data.duration || 0,
      },
    });
  }

  async getVisitorTracks(businessId: string) {
    const list = await this.prisma.visitorTrack.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
    return list.map((item) => ({
      ...item,
      pagesViewed: JSON.parse(item.pagesViewed),
    }));
  }

  // --- Auto Website Scraper & FAQs extraction ---
  async scrapeWebsite(businessId: string, url: string) {
    if (!this.isValidWebUrl(url)) {
      throw new BadRequestException('Invalid or restricted website URL');
    }
    const business = await this.getById(businessId);
    let faqList: Array<{ title: string; content: string }> = [];
    let scrapedText = '';

    try {
      const response = await axios.get(url, { timeout: 4000 });
      const html = response.data;
      
      // Basic text cleanup
      scrapedText = html
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 4000);
    } catch (err: any) {
      console.warn(`Direct crawl failed for ${url}, fallback to mock: ${err?.message || String(err)}`);
    }

    try {
      let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
        aiServiceUrl = `http://${aiServiceUrl}`;
      }
      const response = await axios.post(`${aiServiceUrl}/extract-faqs`, {
        url,
        scraped_text: scrapedText,
        company_name: business.companyName,
        industry: business.industry,
        description: business.description,
      });
      faqList = response.data.faqs;
    } catch (err: any) {
      console.warn(`AI extraction failed, generating fallback FAQs: ${err?.message || String(err)}`);
      faqList = [
        {
          title: `What products/services does ${business.companyName} offer?`,
          content: `${business.companyName} operates in the ${business.industry} industry, providing expert services including ${business.description.substring(0, 80)}...`
        },
        {
          title: `How can I request support from ${business.companyName}?`,
          content: `You can reach out to our team directly through our website at ${url} or by leaving your contact details here in this chat widget.`
        },
        {
          title: `Why choose ${business.companyName}?`,
          content: `We focus on delivering premium, customized results for our clients. Learn more by browsing our portal or starting a live conversation with us.`
        }
      ];
    }

    const createdFAQs: any[] = [];
    for (const faq of faqList) {
      const created = await this.prisma.knowledgeBase.create({
        data: {
          businessId,
          title: this.sanitizeHtml(faq.title),
          content: this.sanitizeHtml(faq.content),
        },
      });
      createdFAQs.push(created);
    }

    await this.redisService.del(`business:${businessId}:faqs`).catch(() => {});
    return { count: createdFAQs.length, faqs: createdFAQs };
  }

  async importText(businessId: string, ownerId: string, body: { title: string; text: string }) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business profile not found or access denied');
    }

    const sanitizedText = this.sanitizeHtml(body.text);
    const sanitizedTitle = this.sanitizeHtml(body.title);

    let faqList: Array<{ title: string; content: string }> = [];
    try {
      let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
        aiServiceUrl = `http://${aiServiceUrl}`;
      }
      const response = await axios.post(`${aiServiceUrl}/extract-faqs`, {
        url: 'Document Upload: ' + sanitizedTitle,
        scraped_text: sanitizedText,
        company_name: business.companyName,
        industry: business.industry,
        description: business.description,
      });
      faqList = response.data.faqs;
    } catch (err: any) {
      console.warn(`AI document extraction failed, generating fallback FAQ: ${err?.message || String(err)}`);
      faqList = [
        {
          title: `What is detailed in the uploaded document "${sanitizedTitle}"?`,
          content: sanitizedText.substring(0, 400) + '...'
        }
      ];
    }

    const createdFAQs: any[] = [];
    for (const faq of faqList) {
      const created = await this.prisma.knowledgeBase.create({
        data: {
          businessId,
          title: this.sanitizeHtml(faq.title),
          content: this.sanitizeHtml(faq.content),
        },
      });
      createdFAQs.push(created);
    }

    await this.redisService.del(`business:${businessId}:faqs`).catch(() => {});
    return { count: createdFAQs.length, faqs: createdFAQs };
  }

  // --- Competitor Domain Analysis ---
  async competitorAnalysis(businessId: string, competitorUrl: string) {
    if (!this.isValidWebUrl(competitorUrl)) {
      throw new BadRequestException('Invalid or restricted website URL');
    }
    const business = await this.getById(businessId);
    let analysisResult: any = {};
    let scrapedText = '';

    try {
      const response = await axios.get(competitorUrl, { timeout: 4000 });
      const html = response.data;
      scrapedText = html
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 4000);
    } catch (err: any) {
      console.warn(`Competitor direct crawl failed for ${competitorUrl}: ${err?.message || String(err)}`);
    }

    try {
      let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
        aiServiceUrl = `http://${aiServiceUrl}`;
      }
      const response = await axios.post(`${aiServiceUrl}/competitor-analysis`, {
        competitor_url: competitorUrl,
        scraped_text: scrapedText,
        my_business: {
          companyName: business.companyName,
          industry: business.industry,
          description: business.description,
        },
      });
      analysisResult = response.data;
    } catch (err: any) {
      console.warn(`AI competitor analysis failed: ${err?.message || String(err)}`);
      analysisResult = {
        serviceCompare: [
          { feature: 'Core Offerings', us: 'Custom ' + business.industry + ' services', competitor: 'Generic solutions' },
          { feature: 'Live AI Support', us: 'Yes (Instant)', competitor: 'No (Contact form only)' },
          { feature: 'Appointment Scheduling', us: 'Yes (Automated)', competitor: 'Manual' },
          { feature: 'Multi-Channel support', us: 'WhatsApp & Insta', competitor: 'Web only' },
        ],
        missingOfferings: [
          'Live instant CRM status callback logs',
          'Geo-location automated lead scoring rules',
          'Multi-user calendar integrations',
        ],
        contentGaps: [
          `SEO terms like 'best ${business.industry} automation'`,
          `Comparison blogs explaining '${business.companyName} vs ${competitorUrl.replace(/^https?:\/\//i, '')}'`,
          'Pricing details context logs',
        ],
      };
    }

    const saved = await this.prisma.competitorAnalysis.create({
      data: {
        businessId,
        competitorUrl,
        analysis: JSON.stringify(analysisResult),
      },
    });

    return {
      ...saved,
      analysis: analysisResult,
    };
  }

  async getCompetitorAnalyses(businessId: string) {
    const list = await this.prisma.competitorAnalysis.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return list.map((item) => ({
      ...item,
      analysis: JSON.parse(item.analysis),
    }));
  }

  // --- Dynamic AI Recommendations Engine ---
  async getRecommendations(businessId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const appointments = await this.prisma.appointment.findMany({
      where: { businessId },
      take: 10,
    });

    const recommendations: any[] = [];

    // Recommendation 1: High Priority Lead follow up
    const hotLeads = leads.filter((l) => l.status === 'HOT');
    if (hotLeads.length > 0) {
      const firstHot = hotLeads[0];
      recommendations.push({
        id: 'rec-1',
        title: 'Action Required: Contact Hot Lead',
        content: `Reach out to ${firstHot.name || 'Anonymous Visitor'} (${firstHot.email || firstHot.phone || 'no contact details provided'}) as soon as possible. AI qualified them as HOT with budget ${firstHot.budget || 'unspecified'}.`,
        priority: 'HIGH',
        category: 'LEAD',
        createdAt: new Date(),
      });
    } else {
      recommendations.push({
        id: 'rec-leads-empty',
        title: 'Boost Conversions',
        content: 'You have no HOT leads yet. Go to Widget Settings to test lead qualification in the chat sandbox.',
        priority: 'MEDIUM',
        category: 'LEAD',
        createdAt: new Date(),
      });
    }

    // Recommendation 2: Calendar appointments check
    const pendingAppts = appointments.filter((a) => a.status === 'PENDING');
    if (pendingAppts.length > 0) {
      recommendations.push({
        id: 'rec-2',
        title: 'Review Scheduled Bookings',
        content: `You have ${pendingAppts.length} pending appointments. Contact leads to confirm availability.`,
        priority: 'HIGH',
        category: 'LEAD',
        createdAt: new Date(),
      });
    }

    // Recommendation 3: Add FAQs based on content suggestions
    const faqs = await this.prisma.knowledgeBase.findMany({
      where: { businessId },
    });
    if (faqs.length < 5) {
      recommendations.push({
        id: 'rec-3',
        title: 'Improve AI Knowledge Base',
        content: `You have only ${faqs.length} FAQ items. Use "Auto Website Learning" to import FAQ context automatically from your business website.`,
        priority: 'MEDIUM',
        category: 'KB',
        createdAt: new Date(),
      });
    }

    // Recommendation 4: Connect WhatsApp/Instagram channel
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (business && !business.whatsappEnabled && !business.instagramEnabled) {
      recommendations.push({
        id: 'rec-4',
        title: 'Multiply Conversions',
        content: 'Integrate WhatsApp & Instagram in the multi-channel panel to engage users where they are active.',
        priority: 'LOW',
        category: 'COMPETITOR',
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  // --- Employee / Team Seats Management Services ---
  async createEmployee(businessId: string, ownerId: string, data: { email: string; name: string; password?: string }) {
    // 1. Verify that requesting user is the owner of the business
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business profile not found or access denied');
    }

    // 2. Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // 3. Hash temporary password
    const tempPassword = data.password || 'Welcome123!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 4. Create EMPLOYEE user associated with the businessId
    const employee = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: 'EMPLOYEE',
        businessId,
      },
    });

    // Queue invite email delivery
    await this.jobsService.addEmailSendingJob(
      employee.email,
      employee.name,
      business.companyName,
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      businessId,
    ).catch(() => {});

    return {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      businessId: employee.businessId,
    };
  }

  async getEmployees(businessId: string, userId: string, userRole: string) {
    // Verify that requesting user is either the owner of the business OR an employee of the business
    if (userRole === 'ADMIN') {
      const business = await this.prisma.business.findFirst({
        where: { id: businessId, ownerId: userId },
      });
      if (!business) {
        throw new NotFoundException('Business profile not found or access denied');
      }
    } else {
      const employee = await this.prisma.user.findFirst({
        where: { id: userId, businessId },
      });
      if (!employee) {
        throw new NotFoundException('Business profile access denied');
      }
    }

    // Return list of employees linked to this business
    return this.prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getPublicDetails(id: string) {
    const cacheKey = `business:${id}:public`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // Ignore cache errors
    }

    const business = await this.prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        website: true,
        industry: true,
        description: true,
        themeColor: true,
        agentTone: true,
        agentPrompt: true,
        widgetGreeting: true,
        widgetRules: true,
        widgetPosition: true,
      },
    });
    if (!business) {
      throw new NotFoundException('Business profile not found');
    }

    try {
      await this.redisService.set(cacheKey, JSON.stringify(business), 3600); // 1 hour TTL
    } catch (err) {
      // Ignore cache errors
    }

    return business;
  }

  private isValidWebUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }
      const hostname = parsed.hostname.toLowerCase();
      
      // Block local and loopback hosts
      const localHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '169.254.169.254'];
      if (localHosts.includes(hostname)) {
        return false;
      }
      
      // Block private IP ranges
      if (
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
      ) {
        return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }
}
