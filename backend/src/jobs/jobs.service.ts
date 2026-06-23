import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue('ai-research') private aiResearchQueue: Queue,
    @InjectQueue('lead-enrichment') private leadEnrichmentQueue: Queue,
    @InjectQueue('email-sending') private emailSendingQueue: Queue,
    @InjectQueue('report-generation') private reportGenerationQueue: Queue,
    @InjectQueue('workflow-automation') private workflowAutomationQueue: Queue,
    @InjectQueue('account-intelligence')
    private accountIntelligenceQueue: Queue,
    @InjectQueue('workflow-execution') private workflowExecutionQueue: Queue,
    @InjectQueue('email-sync') private emailSyncQueue: Queue,
    @InjectQueue('email-sequence') private emailSequenceQueue: Queue,
    @InjectQueue('email-reminder') private emailReminderQueue: Queue,
  ) {}

  // Expose queues for direct controller operations
  getQueues() {
    return {
      'ai-research': this.aiResearchQueue,
      'lead-enrichment': this.leadEnrichmentQueue,
      'email-sending': this.emailSendingQueue,
      'report-generation': this.reportGenerationQueue,
      'workflow-automation': this.workflowAutomationQueue,
      'account-intelligence': this.accountIntelligenceQueue,
      'workflow-execution': this.workflowExecutionQueue,
      'email-sync': this.emailSyncQueue,
      'email-sequence': this.emailSequenceQueue,
      'email-reminder': this.emailReminderQueue,
    };
  }

  /**
   * Helper to generate consistent job options with retries and exponential backoff
   */
  private getStandardJobOptions(uniqueKey: string) {
    return {
      jobId: crypto.createHash('sha256').update(uniqueKey).digest('hex'),
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000, // Starts at 5 seconds delay
      },
      removeOnComplete: { age: 3600 }, // Clean up completed from Redis after 1 hour (logged in DB permanently)
      removeOnFail: false, // DO NOT remove failed jobs so they can be inspected/retried (DLQ behaviour)
    };
  }

  async addAIResearchJob(businessId: string, url: string) {
    const key = `ai-research:${businessId}:${url}`;
    const opts = this.getStandardJobOptions(key);
    this.logger.log(
      `Enqueuing AI Research job for business ${businessId} with URL ${url}`,
    );

    return this.aiResearchQueue.add(
      'scrape-website',
      { businessId, url },
      opts,
    );
  }

  async addLeadEnrichmentJob(leadId: string, businessId: string) {
    const key = `lead-enrichment:${leadId}`;
    const opts = this.getStandardJobOptions(key);
    this.logger.log(`Enqueuing Lead Enrichment job for lead ${leadId}`);

    return this.leadEnrichmentQueue.add(
      'enrich-lead',
      { leadId, businessId },
      opts,
    );
  }

  async addEmailSendingJob(
    email: string,
    name: string,
    businessName: string,
    inviteUrl: string,
    businessId?: string,
  ) {
    const key = `email-sending:${email}:${inviteUrl}`;
    const opts = this.getStandardJobOptions(key);
    this.logger.log(`Enqueuing Email Sending job to ${email}`);

    return this.emailSendingQueue.add(
      'send-invite-email',
      { email, name, businessName, inviteUrl, businessId },
      opts,
    );
  }

  async addGenericEmailJob(data: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    businessId?: string;
    leadId?: string;
    emailActivityId?: string;
    emailAccountId?: string;
    emailType?: string;
    metadata?: any;
  }) {
    const timestamp = Date.now();
    const key = `email-delivery:${data.to}:${data.subject.substring(0, 10)}:${timestamp}`;
    const opts = this.getStandardJobOptions(key);
    this.logger.log(`Enqueuing generic email job to ${data.to} (subject: ${data.subject})`);

    return this.emailSendingQueue.add(
      'send-generic-email',
      data,
      opts,
    );
  }

  async addReportGenerationJob(
    businessId: string,
    format: 'csv' | 'excel' | 'json',
  ) {
    // Unique per business + format + hour to prevent overload, but allow updates
    const hourBucket = Math.floor(Date.now() / 3600000);
    const key = `report-gen:${businessId}:${format}:${hourBucket}`;
    const opts = this.getStandardJobOptions(key);
    this.logger.log(
      `Enqueuing Report Generation job for business ${businessId} (${format})`,
    );

    return this.reportGenerationQueue.add(
      'compile-report',
      { businessId, format },
      opts,
    );
  }

  async addWorkflowAutomationJob(
    businessId: string,
    leadId: string,
    triggerEvent: string,
  ) {
    const key = `workflow-auto:${businessId}:${leadId}:${triggerEvent}`;
    const opts = this.getStandardJobOptions(key);
    this.logger.log(
      `Enqueuing Workflow Automation job for lead ${leadId} (trigger: ${triggerEvent})`,
    );

    return this.workflowAutomationQueue.add(
      'execute-workflow',
      { businessId, leadId, triggerEvent },
      opts,
    );
  }

  async addAccountIntelligenceJob(
    researchId: string,
    domain: string,
    businessId: string,
  ) {
    // Unique key includes timestamp to allow multiple research requests on the same domain
    const key = `account-intel:${researchId}:${domain}:${Date.now()}`;
    const opts = this.getStandardJobOptions(key);
    this.logger.log(
      `Enqueuing Account Intelligence job for domain ${domain} and researchId ${researchId}`,
    );

    return this.accountIntelligenceQueue.add(
      'analyze-account',
      { researchId, domain, businessId },
      opts,
    );
  }

  async addWorkflowExecutionJob(
    executionId: string,
    workflowId: string,
    businessId: string,
  ) {
    const key = `workflow-exec:${executionId}:${Date.now()}`;
    const opts = this.getStandardJobOptions(key);
    this.logger.log(
      `Enqueuing Workflow Execution job for executionId ${executionId}`,
    );

    return this.workflowExecutionQueue.add(
      'execute-workflow',
      { executionId, workflowId, businessId },
      opts,
    );
  }

  async addEmailSyncJob(accountId: string, businessId: string) {
    const key = `email-sync:${accountId}:${Date.now()}`;
    const opts = this.getStandardJobOptions(key);
    this.logger.log(`Enqueuing email sync job for account: ${accountId}`);

    return this.emailSyncQueue.add(
      'sync-inbox',
      { accountId, businessId },
      opts,
    );
  }

  async addSimulatedReplyJob(
    accountId: string,
    sentActivityId: string,
    businessId: string,
  ) {
    const key = `sim-reply:${sentActivityId}:${Date.now()}`;
    const opts = this.getStandardJobOptions(key);
    this.logger.log(
      `Enqueuing simulated reply job for sent activity: ${sentActivityId}`,
    );

    return this.emailSyncQueue.add(
      'simulated-reply',
      { accountId, sentActivityId, businessId },
      opts,
    );
  }

  async addEmailSequenceExecutionJob(
    enrollmentId: string,
    businessId: string,
    delayMs: number,
  ) {
    const key = `seq-exec:${enrollmentId}:${Date.now()}`;
    const opts = {
      ...this.getStandardJobOptions(key),
      delay: delayMs,
    };
    this.logger.log(
      `Enqueuing Sequence Step execution job for enrollment ${enrollmentId} with delay ${delayMs}ms`,
    );

    return this.emailSequenceQueue.add(
      'execute-step',
      { enrollmentId, businessId },
      opts,
    );
  }

  async addEmailReminderJob(activityId: string, delayMs: number) {
    const key = `email-remind:${activityId}:${Date.now()}`;
    const opts = {
      ...this.getStandardJobOptions(key),
      delay: delayMs,
    };
    this.logger.log(
      `Enqueuing Follow-up reminder checking job for activity ${activityId} with delay ${delayMs}ms`,
    );

    return this.emailReminderQueue.add('check-reminder', { activityId }, opts);
  }
}
