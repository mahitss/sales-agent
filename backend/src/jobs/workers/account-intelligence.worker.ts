import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterService } from '../../common/ai/openrouter.service';
import { EmailService } from '../../common/email/email.service';
import { AccountResearchService } from '../../account-research/account-research.service';
import axios from 'axios';

interface StructuredResearch {
  summary: string;
  industry: string;
  employeeEstimate: string;
  techStack: string[];
  challenges: string[];
  opportunities: string[];
  buyingSignals: string[];
  outreachStrategy: string;
  emailDraft: string;
  meetingNotes: string;
}

@Processor('account-intelligence')
export class AccountIntelligenceWorker extends WorkerHost {
  private readonly logger = new Logger(AccountIntelligenceWorker.name);

  constructor(
    private prisma: PrismaService,
    private openRouterService: OpenRouterService,
    private emailService: EmailService,
    @Inject(forwardRef(() => AccountResearchService))
    private accountResearchService: AccountResearchService,
  ) {
    super();
  }

  private isValidWebUrl(val: string): boolean {
    if (!val) return false;
    try {
      const url =
        val.startsWith('http://') || val.startsWith('https://')
          ? val
          : `http://${val}`;
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const startTime = Date.now();
    const { researchId, domain, businessId } = job.data;
    this.logger.log(
      `Processing Account Intelligence job ${job.id} for research ${researchId} (domain: ${domain})`,
    );

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
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
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
          this.logger.warn(
            `Direct crawl failed for ${url}, sending minimal content: ${err?.message || String(err)}`,
          );
        }
      }

      // 2. Update progress to 40% - Crawl complete, AI analysis starting
      await this.prisma.accountResearch.update({
        where: { id: researchId },
        data: { progress: 40 },
      });

      // Formulate prompts for OpenRouter structured completion
      const systemPrompt = `You are an elite AI Account Intelligence Engine and Sales Intelligence Architect.
You must return a JSON object with the following exact keys and types:
{
  "summary": "A concise summary of the company, its mission, and its value proposition.",
  "industry": "The primary industry or sector of the company.",
  "employeeEstimate": "An estimate of the company size or employee count range (e.g. '100-500 employees').",
  "techStack": ["React", "Next.js"], // Key technologies, software, frameworks, or platforms detected in use (array of strings)
  "challenges": ["Challenge 1", "Challenge 2"], // Likely business challenges or pain points faced by the company (array of strings)
  "opportunities": ["Opportunity 1", "Opportunity 2"], // Key sales opportunities, new product matches, or value-add areas for our CRM/SaaS automation tools (array of strings)
  "buyingSignals": ["Signal 1", "Signal 2"], // Growth or buying signals detected (e.g. hiring, fundraising, expansion, new product launches, technology shifts) (array of strings)
  "outreachStrategy": "A recommended personalized sales outreach strategy highlighting why they need our platform.",
  "emailDraft": "A draft of a highly personalized outreach email targeting the company's pain points and showing how we solve them.",
  "meetingNotes": "Meeting preparation notes to guide a sales representative during a first call with this account."
}
Do NOT wrap the JSON inside markdown code blocks. Output raw JSON only.`;

      const userPrompt = `Perform deep account research and analysis on the company website domain: "${domain}".
Use the scraped website content below to extract and synthesize the required intelligence details:
--- SCRAPED WEB CONTENT ---
${scrapedText || 'No website content available. Please simulate details professionally based on the domain name.'}
---------------------------`;

      // Caching key is tenant-scoped and domain specific to avoid redundant external requests
      const cacheKey = `research:${businessId}:${domain}`;

      this.logger.log(`Calling OpenRouter service for domain: ${domain}`);
      const data = await this.openRouterService.generateStructuredCompletion<StructuredResearch>(
        businessId,
        'account_research',
        systemPrompt,
        userPrompt,
        cacheKey,
      );

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
          employeeEstimate: data.employeeEstimate,
          techStack: data.techStack || [],
          challenges: data.challenges || [],
          opportunities: data.opportunities || [],
          buyingSignals: data.buyingSignals || [],
          outreachStrategy: data.outreachStrategy,
          emailDraft: data.emailDraft,
          meetingNotes: data.meetingNotes,
        },
      });

      // 5. Generate PDF briefing report & email the user
      try {
        this.logger.log(`Generating PDF briefing for research ${researchId}`);
        const pdfBuffer = await this.accountResearchService.generatePdf(researchId, businessId);

        const business = await this.prisma.business.findUnique({
          where: { id: businessId },
          include: { owner: true },
        });

        const ownerEmail = business?.owner?.email;
        if (ownerEmail) {
          this.logger.log(`Sending research notification email with PDF to ${ownerEmail}`);
          const emailSubject = `Beacon AI Research Report: ${domain}`;
          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h1 style="color: #10B981;">Account Research Complete</h1>
              <p>Great news! The background research for <strong>${domain}</strong> is complete.</p>
              <p>We have compiled a full briefing including tech stack, pain points, opportunities, outreach strategy, and a personalized email draft.</p>
              <p>Your custom PDF briefing report is attached to this email.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #9ca3af;">Beacon AI Sales Team Agent</p>
            </div>
          `;
          await this.emailService.sendCustomEmail(ownerEmail, emailSubject, emailHtml, [
            {
              filename: `Beacon_Research_${domain}.pdf`,
              content: pdfBuffer,
            },
          ]);
        }
      } catch (notifyErr: any) {
        this.logger.error(
          `Failed to compile PDF or send notification email: ${notifyErr.message}`,
          notifyErr.stack,
        );
      }

      // Record job completion log
      const duration = Date.now() - startTime;
      await this.prisma.jobLog
        .create({
          data: {
            queueName: 'account-intelligence',
            jobId: job.id || 'unknown',
            jobName: job.name,
            status: 'COMPLETED',
            data: job.data,
            duration,
            businessId,
          },
        })
        .catch(() => {});

      return updatedResearch;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Account Intelligence job ${job.id} failed: ${err.message}`,
        err.stack,
      );

      // Save failure status in DB
      await this.prisma.accountResearch
        .update({
          where: { id: researchId },
          data: {
            status: 'FAILED',
            progress: 100,
            error: err.message || 'Unknown enrichment error',
          },
        })
        .catch(() => {});

      // Record failure log
      await this.prisma.jobLog
        .create({
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
        })
        .catch(() => {});

      throw err;
    }
  }
}

