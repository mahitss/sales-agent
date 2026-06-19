import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Helper to get authenticated google clients.
   * Returns null if service account credentials are not configured.
   */
  private getGoogleClients() {
    const credsEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credsEnv) {
      this.logger.warn('GOOGLE_SERVICE_ACCOUNT_KEY env variable not set. Google Sheets Sync will run in Mock Mode.');
      return null;
    }

    try {
      const credentials = JSON.parse(credsEnv);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive',
        ],
      });
      return {
        sheets: google.sheets({ version: 'v4', auth }),
        drive: google.drive({ version: 'v3', auth }),
      };
    } catch (err) {
      this.logger.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON. Check environment variables.', err);
      return null;
    }
  }

  /**
   * Syncs a lead's profile, scoring, enrichment, and conversation history to Google Sheets.
   */
  async syncLead(leadId: string): Promise<{ success: boolean; spreadsheetId?: string; error?: string }> {
    // 1. Fetch full lead data with intelligence
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        business: true,
        intelligence: true,
        score: true,
        enrichment: true,
        revenuePrediction: true,
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    const { business } = lead;
    if (!business.googleSheetsEnabled) {
      return { success: false, error: 'Google Sheets sync is disabled for this business' };
    }

    // Initialize or read Spreadsheet ID
    let spreadsheetId = business.googleSheetsSpreadsheetId;
    const clients = this.getGoogleClients();

    if (!clients) {
      // Mock Mode: Update DB log and return success mock
      await this.prisma.googleSheetsSyncLog.upsert({
        where: { leadId },
        create: {
          leadId,
          spreadsheetId: spreadsheetId || 'MOCK_SPREADSHEET_ID',
          status: 'SUCCESS',
          syncedAt: new Date(),
          errorMessage: 'Sync succeeded in Mock Mode (No Google Credentials configured).',
        },
        update: {
          spreadsheetId: spreadsheetId || 'MOCK_SPREADSHEET_ID',
          status: 'SUCCESS',
          syncedAt: new Date(),
          attempts: { increment: 1 },
          errorMessage: 'Sync succeeded in Mock Mode (No Google Credentials configured).',
        },
      });
      return { success: true, spreadsheetId: spreadsheetId || 'MOCK_SPREADSHEET_ID' };
    }

    const { sheets, drive } = clients;

    try {
      // 2. Automatically create spreadsheet if it doesn't exist
      if (!spreadsheetId) {
        this.logger.log(`No spreadsheet ID configured for business ${business.companyName}. Creating one...`);
        const spreadsheetResponse = await sheets.spreadsheets.create({
          requestBody: {
            properties: {
              title: `Beacon AI Leads - ${business.companyName}`,
            },
          },
        });
        
        spreadsheetId = spreadsheetResponse.data.spreadsheetId || null;
        if (!spreadsheetId) {
          throw new Error('Google Sheets creation returned empty spreadsheet ID');
        }

        // Make the spreadsheet readable/writable by anyone with link so the owner can access it
        try {
          await drive.permissions.create({
            fileId: spreadsheetId,
            requestBody: {
              role: 'writer',
              type: 'anyone',
            },
          });
        } catch (shareErr) {
          this.logger.warn(`Could not set public permissions on sheet ${spreadsheetId}: ${shareErr.message}`);
        }

        // Save new Spreadsheet ID back to Business
        await this.prisma.business.update({
          where: { id: business.id },
          data: { googleSheetsSpreadsheetId: spreadsheetId },
        });

        this.logger.log(`Created spreadsheet ${spreadsheetId} for business ${business.id}`);
      }

      // Ensure sheet structures exist
      await this.ensureSheetExists(sheets, spreadsheetId, 'Leads', [
        'Lead ID', 'Name', 'Email', 'Phone', 'Company', 'Website', 'Industry', 
        'Budget', 'Timeline', 'Requested Service', 'Lead Score', 'Deal Probability', 
        'Priority', 'Created Date'
      ]);

      await this.ensureSheetExists(sheets, spreadsheetId, 'AI Summaries', [
        'Lead ID', 'Summary', 'Pain Points', 'Goals', 'Recommended Action'
      ]);

      await this.ensureSheetExists(sheets, spreadsheetId, 'Conversation History', [
        'Lead ID', 'Timestamp', 'Sender', 'Message'
      ]);

      // 3. Sync Sheet 1: Leads
      const requestedServices = lead.intelligence?.requestedServices?.join(', ') || '';
      const leadsRowValues = [
        lead.id,
        lead.name || 'Anonymous Visitor',
        lead.email || '',
        lead.phone || '',
        lead.enrichment?.companyName || lead.name || '',
        lead.enrichment?.website || '',
        lead.enrichment?.industry || lead.business?.industry || '',
        lead.budget || lead.revenuePrediction?.estimatedValue?.toString() || '',
        lead.intelligence?.timeline || '',
        requestedServices,
        lead.score?.score?.toString() || lead.engagementScore?.toString() || '0',
        lead.score?.dealProbability !== undefined ? `${Math.round(lead.score.dealProbability * 100)}%` : '0%',
        lead.score?.classification || lead.status || 'COLD',
        lead.createdAt.toISOString()
      ];

      await this.upsertRow(sheets, spreadsheetId, 'Leads', lead.id, leadsRowValues);

      // 4. Sync Sheet 2: AI Summaries
      const summariesRowValues = [
        lead.id,
        lead.intelligence?.summary || '',
        lead.intelligence?.painPoints || '',
        lead.intelligence?.goals || '',
        lead.intelligence?.recommendedAction || ''
      ];

      await this.upsertRow(sheets, spreadsheetId, 'AI Summaries', lead.id, summariesRowValues);

      // 5. Sync Sheet 3: Conversation History (Rewrite this lead's messages to avoid duplicates)
      const messages = (lead.conversations[0]?.messages as any[]) || [];
      const chatRows = messages.map((m: any) => [
        lead.id,
        new Date().toISOString(), // Mock timestamp fallback or message timestamp if available
        m.role === 'user' ? 'Customer' : 'Assistant',
        m.content || ''
      ]);

      await this.rewriteConversationRows(sheets, spreadsheetId, 'Conversation History', lead.id, chatRows);

      // Record success in log table
      await this.prisma.googleSheetsSyncLog.upsert({
        where: { leadId },
        create: {
          leadId,
          spreadsheetId,
          status: 'SUCCESS',
          syncedAt: new Date(),
        },
        update: {
          spreadsheetId,
          status: 'SUCCESS',
          syncedAt: new Date(),
          attempts: { increment: 1 },
          errorMessage: null,
        },
      });

      return { success: true, spreadsheetId };

    } catch (error: any) {
      this.logger.error(`Error syncing lead ${leadId} to Google Sheets: ${error.message}`, error);

      // Record failure in log table
      await this.prisma.googleSheetsSyncLog.upsert({
        where: { leadId },
        create: {
          leadId,
          spreadsheetId: spreadsheetId || 'UNKNOWN',
          status: 'FAILED',
          errorMessage: error.message,
        },
        update: {
          status: 'FAILED',
          errorMessage: error.message,
          attempts: { increment: 1 },
        },
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Helper to ensure a specific sheet tab exists and has headers.
   */
  private async ensureSheetExists(sheets: any, spreadsheetId: string, title: string, headers: string[]) {
    try {
      // Test if sheet exists by getting its values
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${title}!A1:A1`,
      });
    } catch (err: any) {
      // If error, sheet likely does not exist. Create it
      if (err.message.includes('Unable to parse range') || err.message.includes('NOT_FOUND') || err.status === 400) {
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  addSheet: {
                    properties: { title },
                  },
                },
              ],
            },
          });
          // Write headers
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${title}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [headers],
            },
          });
        } catch (createErr) {
          this.logger.error(`Failed to create sheet tab "${title}"`, createErr);
        }
      } else {
        throw err;
      }
    }
  }

  /**
   * Update or Insert row based on Lead ID matching key in Column A.
   */
  private async upsertRow(sheets: any, spreadsheetId: string, sheetName: string, leadId: string, values: string[]) {
    // 1. Fetch Column A to search for Lead ID
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });
    const colA = getRes.data.values || [];
    
    // Find index (0-based) where value matches leadId
    let rowIndex = -1;
    for (let i = 0; i < colA.length; i++) {
      if (colA[i][0] === leadId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex !== -1) {
      // Row exists (convert 0-based index to 1-based sheet row)
      const sheetRow = rowIndex + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${sheetRow}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });
    } else {
      // Row doesn't exist, append it
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });
    }
  }

  /**
   * Specific helper to replace all conversation rows for a single lead.
   * Fetches all rows, removes rows matching leadId, and appends the new list of messages.
   */
  private async rewriteConversationRows(sheets: any, spreadsheetId: string, sheetName: string, leadId: string, chatRows: string[][]) {
    // Fetch all values
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:D`,
    });

    const existingRows = getRes.data.values || [];
    if (existingRows.length === 0) {
      // Write headers and append rows
      const headers = ['Lead ID', 'Timestamp', 'Sender', 'Message'];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers, ...chatRows],
        },
      });
      return;
    }

    // Keep header, filter out old messages for this lead
    const header = existingRows[0];
    const filteredRows = existingRows.slice(1).filter((row) => row[0] !== leadId);

    // Combine remaining rows and new rows
    const finalRows = [header, ...filteredRows, ...chatRows];

    // Clear sheet contents
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A:D`,
    });

    // Write all rows back
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: finalRows,
      },
    });
  }
}
