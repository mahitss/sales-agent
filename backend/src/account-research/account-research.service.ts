import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

@Injectable()
export class AccountResearchService {
  private readonly logger = new Logger(AccountResearchService.name);

  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

  async createResearch(businessId: string, domain: string) {
    // Validate domain prefix or format simple clean up
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, '');

    // Check if there is an existing COMPLETED research for this domain and business to reuse/cache results
    const completed = await this.prisma.accountResearch.findFirst({
      where: {
        businessId,
        domain: cleanDomain,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (completed) {
      this.logger.log(`Reusing completed research for domain: ${cleanDomain} (Business: ${businessId})`);
      return completed;
    }

    // Check if there is an existing PENDING or PROCESSING research for this domain and business to avoid duplicate work
    const existing = await this.prisma.accountResearch.findFirst({
      where: {
        businessId,
        domain: cleanDomain,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (existing) {
      return existing;
    }

    // Create the record
    const research = await this.prisma.accountResearch.create({
      data: {
        businessId,
        domain: cleanDomain,
        status: 'PENDING',
        progress: 0,
      },
    });

    // Enqueue job in BullMQ
    try {
      await this.jobsService.addAccountIntelligenceJob(
        research.id,
        cleanDomain,
        businessId,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to enqueue account intelligence job: ${err.message}`,
      );
      await this.prisma.accountResearch.update({
        where: { id: research.id },
        data: {
          status: 'FAILED',
          error: 'Failed to enqueue background job. Please retry.',
        },
      });
      throw err;
    }

    return research;
  }

  async getHistory(businessId: string) {
    return this.prisma.accountResearch.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDetails(id: string, businessId: string) {
    const research = await this.prisma.accountResearch.findUnique({
      where: { id },
    });

    if (!research) {
      throw new NotFoundException('Research profile not found');
    }

    if (research.businessId !== businessId) {
      throw new ForbiddenException('Tenancy isolation violation');
    }

    return research;
  }

  async generatePdf(id: string, businessId: string): Promise<Buffer> {
    const research = await this.getDetails(id, businessId);

    // Create temporary workspace files
    const tmpDir = os.tmpdir();
    const tempJsonPath = path.join(tmpDir, `research_${id}.json`);
    const tempPdfPath = path.join(tmpDir, `research_${id}.pdf`);

    try {
      // Write database results to temp JSON file
      await fs.writeFile(tempJsonPath, JSON.stringify(research), 'utf8');

      // Resolve script path
      const scriptPath = path.resolve(
        __dirname,
        '..',
        'jobs',
        'generate_research_pdf.py',
      );

      // Execute Python PDF generation script
      // Note: We use the system Python which has reportlab installed
      const command = `python "${scriptPath}" "${tempJsonPath}" "${tempPdfPath}"`;
      this.logger.log(`Compiling PDF via Python command: ${command}`);

      await execAsync(command);

      // Read PDF binary buffer
      const pdfBuffer = await fs.readFile(tempPdfPath);
      return pdfBuffer;
    } catch (err: any) {
      this.logger.error(
        `ReportLab PDF generation script failed: ${err.message}`,
        err.stack,
      );
      throw new Error(`Failed to generate PDF briefing: ${err.message}`);
    } finally {
      // Cleanup temp files asynchronously
      await fs.unlink(tempJsonPath).catch(() => {});
      await fs.unlink(tempPdfPath).catch(() => {});
    }
  }
}
