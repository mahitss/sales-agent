import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

@Processor('account-intelligence')
export class AccountIntelligenceWorker extends WorkerHost {
  private readonly logger = new Logger(AccountIntelligenceWorker.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  private isValidWebUrl(val: string): boolean {
    if (!val) return false;
    try {
      const url = val.startsWith('http://') || val.startsWith('https://') ? val : `http://${val}`;
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const startTime = Date.now();
    const { researchId, domain, businessId } = job.data;
    this.logger.log(`Processing Account Intelligence job ${job.id} for research ${researchId} (domain: ${domain})`);

    try {
      // 1. Update progress to 10% - Crawling started
      await this.prisma.accountResearch.update({
        where: { id: researchId },
        data: { status: 'PROCESSING', progress: 10 },
      });

      // Format URL properly
      let url = domain;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }

      let scrapedText = '';
      if (this.isValidWebUrl(url)) {
        try {
          this.logger.log(`Crawling domain homepage: ${url}`);
          const response = await axios.get(url, { 
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          const html = response.data;
          // Basic HTML text extraction
          scrapedText = String(html)
            .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
            .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 4000);
        } catch (err: any) {
          this.logger.warn(`Direct crawl failed for ${url}, sending minimal content: ${err?.message || String(err)}`);
        }
      }

      // 2. Update progress to 40% - Crawl complete, AI analysis starting
      await this.prisma.accountResearch.update({
        where: { id: researchId },
        data: { progress: 40 },
      });

      // Contact FastAPI service
      let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
        aiServiceUrl = `http://${aiServiceUrl}`;
      }

      this.logger.log(`Requesting Gemini analysis from AI service: ${aiServiceUrl}/analyze-account`);
      
      const aiResponse = await axios.post(`${aiServiceUrl}/analyze-account`, {
        domain,
        scraped_text: scrapedText,
      });

      const data = aiResponse.data;

      // 3. Update progress to 80% - AI enrichment finished, preparing database entries
      await this.prisma.accountResearch.update({
        where: { id: researchId },
        data: { progress: 80 },
      });

      // 4. Save results and set progress to 100%
      const updatedResearch = await this.prisma.accountResearch.update({
        where: { id: researchId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          summary: data.summary,
          industry: data.industry,
          employeeEstimate: data.employee_estimate,
          techStack: data.tech_stack || [],
          challenges: data.challenges || [],
          opportunities: data.opportunities || [],
          buyingSignals: data.buying_signals || [],
          outreachStrategy: data.outreach_strategy,
          emailDraft: data.email_draft,
          meetingNotes: data.meeting_notes,
        },
      });

      // Record job completion log
      const duration = Date.now() - startTime;
      await this.prisma.jobLog.create({
        data: {
          queueName: 'account-intelligence',
          jobId: job.id || 'unknown',
          jobName: job.name,
          status: 'COMPLETED',
          data: job.data,
          duration,
          businessId,
        },
      }).catch(() => {});

      return updatedResearch;

    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`Account Intelligence job ${job.id} failed: ${err.message}`, err.stack);

      // Save failure status in DB
      await this.prisma.accountResearch.update({
        where: { id: researchId },
        data: {
          status: 'FAILED',
          progress: 100,
          error: err.message || 'Unknown enrichment error',
        },
      }).catch(() => {});

      // Record failure log
      await this.prisma.jobLog.create({
        data: {
          queueName: 'account-intelligence',
          jobId: job.id || 'unknown',
          jobName: job.name,
          status: 'FAILED',
          data: job.data,
          error: `${err.message}\n${err.stack || ''}`,
          duration,
          businessId,
        },
      }).catch(() => {});

      throw err;
    }
  }
}
