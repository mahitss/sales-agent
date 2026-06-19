import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { LeadIntelligenceService } from './lead-intelligence.service';

@Injectable()
export class LeadQueueService implements OnModuleInit {
  private readonly logger = new Logger(LeadQueueService.name);
  private readonly queue$ = new Subject<string>();

  constructor(private leadIntelligenceService: LeadIntelligenceService) {}

  onModuleInit() {
    this.logger.log('Initializing Background Lead Intelligence Worker Queue...');
    this.queue$
      .pipe(
        concatMap(async (leadId) => {
          this.logger.log(`Worker picked up lead ${leadId} from background queue.`);
          try {
            const result = await this.leadIntelligenceService.processLeadAnalysis(leadId);
            this.logger.log(`Worker completed background processing for lead ${leadId}: ${result ? 'SUCCESS' : 'FAILED'}`);
          } catch (err: any) {
            this.logger.error(`Error in queue worker for lead ${leadId}: ${err.message}`, err.stack);
          }
        }),
      )
      .subscribe();
  }

  /**
   * Enqueue a lead to the background processing queue.
   */
  enqueue(leadId: string) {
    this.logger.log(`Enqueuing lead ${leadId} for async intelligence processing...`);
    this.queue$.next(leadId);
  }
}
