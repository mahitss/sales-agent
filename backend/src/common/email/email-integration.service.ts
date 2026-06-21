import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsService } from '../../jobs/jobs.service';
import axios from 'axios';

@Injectable()
export class EmailIntegrationService {
  private readonly logger = new Logger(EmailIntegrationService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => JobsService))
    private jobsService: JobsService,
  ) {}

  /**
   * Generates authorization connect redirection URL
   */
  getConnectUrl(
    provider: 'GMAIL' | 'OUTLOOK',
    redirectUri: string,
    businessId: string,
  ): string {
    const state = JSON.stringify({ businessId, provider });

    if (provider === 'GMAIL') {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      if (!clientId) {
        // Return simulated redirect for mock authentication
        return `${redirectUri}?code=mock_gmail_code_${Math.floor(Math.random() * 10000)}&state=${encodeURIComponent(state)}`;
      }
      const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
      ].join(' ');

      return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}&access_type=offline&prompt=consent`;
    } else {
      const clientId = this.configService.get<string>('AZURE_CLIENT_ID');
      if (!clientId) {
        // Return simulated redirect for mock authentication
        return `${redirectUri}?code=mock_outlook_code_${Math.floor(Math.random() * 10000)}&state=${encodeURIComponent(state)}`;
      }
      const scopes = [
        'offline_access',
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
      ].join(' ');

      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scopes)}&state=${state}`;
    }
  }

  /**
   * Exchanges code for tokens and registers the connection
   */
  async handleCallback(
    provider: 'GMAIL' | 'OUTLOOK',
    code: string,
    redirectUri: string,
    businessId: string,
  ): Promise<any> {
    this.logger.log(
      `Handling OAuth callback for provider ${provider} in business ${businessId}`,
    );

    let email = '';
    let accessToken = 'mock_access_token';
    let refreshToken = 'mock_refresh_token';
    let expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    // Handle mock authorization bypass
    if (code.startsWith('mock_')) {
      email =
        provider === 'GMAIL'
          ? `demo-gmail-${businessId.substring(0, 4)}@gmail.com`
          : `demo-outlook-${businessId.substring(0, 4)}@outlook.com`;
      this.logger.log(`Mock authentication matched: registered ${email}`);
    } else {
      // Real OAuth flow
      try {
        if (provider === 'GMAIL') {
          const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
          const clientSecret = this.configService.get<string>(
            'GOOGLE_CLIENT_SECRET',
          );

          const tokenRes = await axios.post(
            'https://oauth2.googleapis.com/token',
            {
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code',
            },
          );

          accessToken = tokenRes.data.access_token;
          refreshToken = tokenRes.data.refresh_token || '';
          expiresAt = new Date(
            Date.now() + (tokenRes.data.expires_in || 3600) * 1000,
          );

          // Get profile email
          const profileRes = await axios.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          );
          email = profileRes.data.email;
        } else {
          const clientId = this.configService.get<string>('AZURE_CLIENT_ID');
          const clientSecret = this.configService.get<string>(
            'AZURE_CLIENT_SECRET',
          );

          const tokenRes = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            new URLSearchParams({
              client_id: clientId || '',
              client_secret: clientSecret || '',
              code,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code',
            }).toString(),
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
          );

          accessToken = tokenRes.data.access_token;
          refreshToken = tokenRes.data.refresh_token || '';
          expiresAt = new Date(
            Date.now() + (tokenRes.data.expires_in || 3600) * 1000,
          );

          // Get profile email
          const profileRes = await axios.get(
            'https://graph.microsoft.com/v1.0/me',
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          );
          email = profileRes.data.mail || profileRes.data.userPrincipalName;
        }
      } catch (err: any) {
        this.logger.error(
          `OAuth code exchange failed: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`,
        );
        throw new Error(
          `Failed to authenticate with ${provider} OAuth Provider`,
        );
      }
    }

    // Save EmailAccount connection in Database
    const account = await this.prisma.emailAccount.upsert({
      where: {
        businessId_email: { businessId, email },
      },
      create: {
        businessId,
        provider,
        email,
        accessToken,
        refreshToken,
        expiresAt,
        syncState: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), // default sync 7 days history
      },
      update: {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt,
        updatedAt: new Date(),
      },
    });

    // Enqueue initial sync immediately
    await this.jobsService.addEmailSyncJob(account.id, businessId);

    return account;
  }

  /**
   * Refreshes access tokens dynamically
   */
  async refreshAccessToken(accountId: string): Promise<string> {
    const account = await this.prisma.emailAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new Error('Connected email account not found');

    // Token has not expired yet (buffer of 2 minutes)
    if (account.expiresAt.getTime() > Date.now() + 120 * 1000) {
      return account.accessToken;
    }

    if (account.email.startsWith('demo-')) {
      // Mock bypass refresh
      const newExpiresAt = new Date(Date.now() + 3600 * 1000);
      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: { expiresAt: newExpiresAt },
      });
      return account.accessToken;
    }

    this.logger.log(
      `Refreshing access token for email account: ${account.email}`,
    );

    try {
      if (account.provider === 'GMAIL') {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get<string>(
          'GOOGLE_CLIENT_SECRET',
        );

        const res = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: account.refreshToken,
          grant_type: 'refresh_token',
        });

        const accessToken = res.data.access_token;
        const expiresAt = new Date(
          Date.now() + (res.data.expires_in || 3600) * 1000,
        );

        await this.prisma.emailAccount.update({
          where: { id: accountId },
          data: { accessToken, expiresAt },
        });

        return accessToken;
      } else {
        const clientId = this.configService.get<string>('AZURE_CLIENT_ID');
        const clientSecret = this.configService.get<string>(
          'AZURE_CLIENT_SECRET',
        );

        const res = await axios.post(
          'https://login.microsoftonline.com/common/oauth2/v2.0/token',
          new URLSearchParams({
            client_id: clientId || '',
            client_secret: clientSecret || '',
            refresh_token: account.refreshToken || '',
            grant_type: 'refresh_token',
          }).toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
        );

        const accessToken = res.data.access_token;
        const expiresAt = new Date(
          Date.now() + (res.data.expires_in || 3600) * 1000,
        );

        await this.prisma.emailAccount.update({
          where: { id: accountId },
          data: { accessToken, expiresAt },
        });

        return accessToken;
      }
    } catch (err: any) {
      this.logger.error(
        `OAuth token refresh failed for ${account.email}: ${err.message}`,
      );
      throw new Error(
        `Failed to refresh OAuth credentials for connection: ${account.email}`,
      );
    }
  }

  /**
   * Delivers outbound emails using OAuth API calls
   */
  async sendEmail(
    accountId: string,
    to: string,
    subject: string,
    bodyHtml: string,
  ): Promise<string> {
    const account = await this.prisma.emailAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new Error('Email integration account not found');

    const trackingPixelUrl = `${this.configService.get<string>('BACKEND_URL') || 'http://localhost:4000'}/email-tracking/open`;

    // Create preliminary EmailActivity record to generate a tracking ID
    const activity = await this.prisma.emailActivity.create({
      data: {
        businessId: account.businessId,
        emailAccountId: account.id,
        messageId: `pending-send-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        threadId: `thread-${Date.now()}`,
        subject,
        body: bodyHtml,
        fromAddress: account.email,
        toAddress: to,
        direction: 'SENT',
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Inject tracking open pixel transparent GIF inside HTML
    const trackingTag = `<img src="${trackingPixelUrl}/${activity.id}" width="1" height="1" alt="" style="display:none;" />`;
    const finalHtmlBody = `${bodyHtml}\n${trackingTag}`;

    let finalMessageId = `msg-id-${activity.id}`;
    let finalThreadId = activity.threadId;

    if (account.email.startsWith('demo-')) {
      // Mock sent behavior
      this.logger.log(
        `[MOCK EMAIL SEND] Account: ${account.email} | To: ${to} | Subject: ${subject}`,
      );

      // Update with final mock IDs
      await this.prisma.emailActivity.update({
        where: { id: activity.id },
        data: {
          messageId: finalMessageId,
          body: finalHtmlBody,
        },
      });

      // Trigger automatic simulated lead reply background check after 8 seconds
      setTimeout(() => {
        this.jobsService
          .addSimulatedReplyJob(account.id, activity.id, account.businessId)
          .catch((err) => {
            this.logger.error(
              `Failed to dispatch simulated reply: ${err.message}`,
            );
          });
      }, 8000);

      return finalMessageId;
    }

    // Refresh token
    const token = await this.refreshAccessToken(accountId);

    try {
      if (account.provider === 'GMAIL') {
        // Construct raw MIME email
        const mimeMessage = [
          `From: ${account.email}`,
          `To: ${to}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset=utf-8',
          '',
          finalHtmlBody,
        ].join('\n');

        const base64SafeMime = Buffer.from(mimeMessage)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const sendRes = await axios.post(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          {
            raw: base64SafeMime,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        finalMessageId = sendRes.data.id;
        finalThreadId = sendRes.data.threadId;
      } else {
        // Send Outlook mail
        const sendRes = await axios.post(
          'https://graph.microsoft.com/v1.0/me/sendMail',
          {
            message: {
              subject,
              body: {
                contentType: 'HTML',
                content: finalHtmlBody,
              },
              toRecipients: [{ emailAddress: { address: to } }],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        // Outlook sends HTTP 202 without body. Generate random message ID or retrieve header
        finalMessageId = `graph-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }

      // Find if lead exists and link it
      const lead = await this.prisma.lead.findFirst({
        where: { businessId: account.businessId, email: to },
      });

      // Update actual details in activity record
      await this.prisma.emailActivity.update({
        where: { id: activity.id },
        data: {
          messageId: finalMessageId,
          threadId: finalThreadId,
          leadId: lead?.id || null,
          body: finalHtmlBody,
        },
      });

      return finalMessageId;
    } catch (err: any) {
      this.logger.error(
        `Failed to send email via API: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`,
      );
      await this.prisma.emailActivity
        .update({
          where: { id: activity.id },
          data: { status: 'FAILED' },
        })
        .catch(() => {});
      throw err;
    }
  }

  /**
   * Synchronizes inbox and parses messages
   */
  async syncInbox(accountId: string): Promise<{ messagesSynced: number }> {
    const account = await this.prisma.emailAccount.findUnique({
      where: { id: accountId },
      include: { business: true },
    });
    if (!account) throw new Error('Email account connection not found');

    const businessId = account.businessId;
    let messagesSynced = 0;

    // Simulate mock email syncing in sandbox modes
    if (account.email.startsWith('demo-')) {
      const isInitial =
        !account.syncState || account.syncState.includes('2026');

      if (isInitial) {
        this.logger.log(
          `Simulating initial sync for mock sandbox account: ${account.email}`,
        );

        // Simulating two mock incoming emails
        const mockEmails = [
          {
            from: 'alicia.roberts@cloudcorp.com',
            fromName: 'Alicia Roberts',
            subject: 'Beacon AI Integrations & API Options Query',
            body: 'Hello Team,\n\nI was looking at your corporate site and am interested in connecting Beacon AI to our HubSpot CRM instance. Do you support visual pipelines out-of-the-box or require custom code?\n\nThanks,\nAlicia Roberts\nCloudCorp Inc.',
            date: new Date(Date.now() - 3600 * 1000 * 2), // 2 hours ago
          },
          {
            from: 'marcus.vance@vancestrategy.co',
            fromName: 'Marcus Vance',
            subject: 'Request for Product Demo - Custom Orchestrations',
            body: 'Hi Beacon team,\n\nWe would like to book a product overview demo next Wednesday at 10 AM EST for 5 attendees to review your background job queue architecture and multi-channel workflows.\n\nBest,\nMarcus Vance\nManaging Partner',
            date: new Date(Date.now() - 3600 * 1000 * 5), // 5 hours ago
          },
        ];

        for (const mail of mockEmails) {
          // Check if Lead exists
          let lead = await this.prisma.lead.findFirst({
            where: { businessId, email: mail.from },
          });

          if (!lead) {
            // Auto-create lead
            lead = await this.prisma.lead.create({
              data: {
                businessId,
                name: mail.fromName,
                email: mail.from,
                source: 'EMAIL',
                status: 'COLD',
              },
            });
            this.logger.log(
              `[SYNC AUTO-CREATE LEAD] Created lead profile for ${mail.from}`,
            );
          }

          await this.prisma.emailActivity.upsert({
            where: {
              messageId: `mock-msg-${mail.from.substring(0, 5)}-${mail.date.getTime()}`,
            },
            create: {
              businessId,
              emailAccountId: account.id,
              messageId: `mock-msg-${mail.from.substring(0, 5)}-${mail.date.getTime()}`,
              threadId: `mock-thread-${mail.from.substring(0, 5)}`,
              subject: mail.subject,
              body: mail.body,
              fromAddress: mail.from,
              toAddress: account.email,
              direction: 'RECEIVED',
              status: 'RECEIVED',
              leadId: lead.id,
              sentAt: mail.date,
            },
            update: {},
          });
          messagesSynced++;
        }

        // Set sync state
        await this.prisma.emailAccount.update({
          where: { id: account.id },
          data: { syncState: new Date().toISOString() },
        });
      }

      return { messagesSynced };
    }

    // Real API integration syncing
    const token = await this.refreshAccessToken(accountId);
    const lastSyncTime = account.syncState
      ? new Date(account.syncState)
      : new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const nowSyncTime = new Date();

    try {
      if (account.provider === 'GMAIL') {
        const query = `after:${Math.floor(lastSyncTime.getTime() / 1000)}`;
        const listRes = await axios.get(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages',
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { q: query, maxResults: 20 },
          },
        );

        const messages = listRes.data.messages || [];
        for (const msgSummary of messages) {
          const detailRes = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgSummary.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const detail = detailRes.data;

          // Parse headers
          const headers = detail.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find(
              (h: any) => h.name.toLowerCase() === name.toLowerCase(),
            )?.value || '';

          const fromHeader = getHeader('from');
          const toHeader = getHeader('to');
          const subject = getHeader('subject') || 'No Subject';
          const dateStr = getHeader('date');

          // Extract pure email from From header: "John Doe" <john@example.com>
          const parseAddress = (headerStr: string) => {
            const match = headerStr.match(/<([^>]+)>/);
            if (match && match[1]) return match[1].trim();
            return headerStr.trim();
          };

          const fromEmail = parseAddress(fromHeader);
          const toEmail = parseAddress(toHeader);
          const body = detail.snippet || '';

          const direction =
            fromEmail.toLowerCase() === account.email.toLowerCase()
              ? 'SENT'
              : 'RECEIVED';
          const targetEmail = direction === 'SENT' ? toEmail : fromEmail;

          // Search or auto-create lead profile
          let lead = await this.prisma.lead.findFirst({
            where: { businessId, email: targetEmail },
          });

          if (!lead && direction === 'RECEIVED') {
            // Auto-create lead
            const nameMatch = fromHeader.match(/^"([^"]+)"/);
            const leadName = nameMatch ? nameMatch[1] : fromEmail.split('@')[0];
            lead = await this.prisma.lead.create({
              data: {
                businessId,
                name: leadName,
                email: targetEmail,
                source: 'EMAIL',
                status: 'COLD',
              },
            });
            this.logger.log(
              `[SYNC AUTO-CREATE LEAD] Created lead profile for ${targetEmail}`,
            );
          }

          // Save Activity
          const activity = await this.prisma.emailActivity.upsert({
            where: { messageId: detail.id },
            create: {
              businessId,
              emailAccountId: account.id,
              messageId: detail.id,
              threadId: detail.threadId,
              subject,
              body,
              fromAddress: fromEmail,
              toAddress: toEmail,
              direction,
              status: direction === 'SENT' ? 'SENT' : 'RECEIVED',
              leadId: lead?.id || null,
              sentAt: dateStr ? new Date(dateStr) : new Date(),
            },
            update: {
              leadId: lead?.id || undefined,
            },
          });

          // Check if received message is a reply to stop active sequences
          if (direction === 'RECEIVED' && lead) {
            await this.processReplyTrigger(lead.id, detail.threadId);
          }

          messagesSynced++;
        }
      } else {
        // Outlook Graph Syncing
        const formattedDate = lastSyncTime.toISOString();
        const listRes = await axios.get(
          'https://graph.microsoft.com/v1.0/me/messages',
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              $filter: `receivedDateTime ge ${formattedDate}`,
              $top: 20,
            },
          },
        );

        const messages = listRes.data.value || [];
        for (const msg of messages) {
          const fromEmail = msg.from?.emailAddress?.address || '';
          const toEmail = msg.toRecipients?.[0]?.emailAddress?.address || '';
          const subject = msg.subject || 'No Subject';
          const body = msg.bodyPreview || '';

          const direction =
            fromEmail.toLowerCase() === account.email.toLowerCase()
              ? 'SENT'
              : 'RECEIVED';
          const targetEmail = direction === 'SENT' ? toEmail : fromEmail;

          let lead = await this.prisma.lead.findFirst({
            where: { businessId, email: targetEmail },
          });

          if (!lead && direction === 'RECEIVED') {
            lead = await this.prisma.lead.create({
              data: {
                businessId,
                name: msg.from?.emailAddress?.name || fromEmail.split('@')[0],
                email: targetEmail,
                source: 'EMAIL',
                status: 'COLD',
              },
            });
            this.logger.log(
              `[SYNC AUTO-CREATE LEAD] Created lead profile for ${targetEmail}`,
            );
          }

          await this.prisma.emailActivity.upsert({
            where: { messageId: msg.id },
            create: {
              businessId,
              emailAccountId: account.id,
              messageId: msg.id,
              threadId: msg.conversationId,
              subject,
              body,
              fromAddress: fromEmail,
              toAddress: toEmail,
              direction,
              status: direction === 'SENT' ? 'SENT' : 'RECEIVED',
              leadId: lead?.id || null,
              sentAt: new Date(msg.sentDateTime || msg.receivedDateTime),
            },
            update: {
              leadId: lead?.id || undefined,
            },
          });

          if (direction === 'RECEIVED' && lead) {
            await this.processReplyTrigger(lead.id, msg.conversationId);
          }

          messagesSynced++;
        }
      }

      // Update sync state timestamp
      await this.prisma.emailAccount.update({
        where: { id: account.id },
        data: { syncState: nowSyncTime.toISOString() },
      });
    } catch (err: any) {
      this.logger.error(
        `Error during inbox syncing: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`,
      );
    }

    return { messagesSynced };
  }

  /**
   * Helper that pauses/completes active sequence enrollments when a lead replies.
   */
  async processReplyTrigger(leadId: string, threadId: string) {
    // 1. Mark matching sent activity in thread as replied
    const sentActivity = await this.prisma.emailActivity.findFirst({
      where: { leadId, threadId, direction: 'SENT', repliedAt: null },
    });

    if (sentActivity) {
      await this.prisma.emailActivity.update({
        where: { id: sentActivity.id },
        data: { repliedAt: new Date() },
      });
      this.logger.log(
        `Linked reply received to email sent activity ${sentActivity.id}`,
      );
    }

    // 2. Terminate or pause sequence enrollment for this lead
    const activeEnrollments =
      await this.prisma.emailSequenceEnrollment.findMany({
        where: { leadId, status: 'ACTIVE' },
      });

    for (const enrollment of activeEnrollments) {
      await this.prisma.emailSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'COMPLETED' }, // auto-complete sequence since they replied
      });
      this.logger.log(
        `Auto-paused/completed active sequence enrollment ${enrollment.id} for lead ${leadId} due to reply.`,
      );
    }
  }

  /**
   * Processes a simulated mock reply for demo/sandbox environments
   */
  async handleSimulatedReply(
    accountId: string,
    sentActivityId: string,
    businessId: string,
  ) {
    const activity = await this.prisma.emailActivity.findUnique({
      where: { id: sentActivityId },
      include: { emailAccount: true },
    });
    if (!activity || !activity.leadId) return;

    const lead = await this.prisma.lead.findUnique({
      where: { id: activity.leadId },
    });
    if (!lead) return;

    this.logger.log(
      `[SIMULATING INBOUND REPLY] Generating mock reply from ${lead.email} on thread ${activity.threadId}`,
    );

    const replyBody = `Hi,\n\nThanks for reaching out! Your proposal sounds interesting. Let's schedule a brief 15-minute call next Tuesday at 2 PM EST to discuss.\n\nBest,\n${lead.name || 'Customer'}`;
    const replyMessageId = `mock-reply-msg-${Date.now()}`;

    // Create incoming activity record
    await this.prisma.emailActivity.create({
      data: {
        businessId,
        emailAccountId: accountId,
        messageId: replyMessageId,
        threadId: activity.threadId,
        subject: `Re: ${activity.subject}`,
        body: replyBody,
        fromAddress: lead.email || '',
        toAddress: activity.emailAccount.email,
        direction: 'RECEIVED',
        status: 'RECEIVED',
        leadId: lead.id,
        sentAt: new Date(),
      },
    });

    // Process reply triggers
    await this.processReplyTrigger(lead.id, activity.threadId);
  }
}
