import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/chat.dto';
import axios from 'axios';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(dto: SendMessageDto) {
    const { message, businessId, leadId: inputLeadId, conversationId: inputConvId, channel } = dto;

    // 1. Get or create Lead
    let lead;
    if (inputLeadId) {
      lead = await this.prisma.lead.findUnique({ where: { id: inputLeadId } });
    }
    if (!lead) {
      lead = await this.prisma.lead.create({
        data: {
          businessId,
          name: 'Anonymous Visitor',
          source: channel || 'WIDGET',
          status: 'COLD',
        },
      });
    }

    // 2. Get or create Conversation
    let conversation;
    if (inputConvId) {
      conversation = await this.prisma.conversation.findUnique({ where: { id: inputConvId } });
    }
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          leadId: lead.id,
          businessId,
          messages: '[]',
          channel: channel || 'WIDGET',
        },
      });
    }

    // --- Human Takeover Bypass ---
    if (conversation?.isHumanTakeover) {
      const messageHistory = JSON.parse(conversation.messages);
      messageHistory.push({ role: 'user', content: message });
      
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          leadId: lead.id,
          messages: JSON.stringify(messageHistory),
        },
      });

      return {
        response: 'A live agent is currently typing...',
        intent: 'HumanTakeoverActive',
        leadId: lead.id,
        conversationId: conversation.id,
        lead,
        isHumanTakeover: true,
      };
    }

    // Parse messages history
    const messageHistory = JSON.parse(conversation.messages);

    // Add current user message
    messageHistory.push({ role: 'user', content: message });

    // 3. Load business details and FAQs
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { knowledgeBases: true },
    });
    if (!business) {
      throw new Error('Business profile not found');
    }

    // Prepare payload for Python AI service
    let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
      aiServiceUrl = `http://${aiServiceUrl}`;
    }
    const payload = {
      messages: messageHistory,
      business_info: {
        companyName: business.companyName,
        website: business.website,
        industry: business.industry,
        description: business.description,
        agentTone: business.agentTone,
        agentPrompt: business.agentPrompt,
      },
      faqs: business.knowledgeBases.map((kb) => ({
        title: kb.title,
        content: kb.content,
      })),
      current_lead: {
        name: lead.name === 'Anonymous Visitor' ? null : lead.name,
        email: lead.email,
        phone: lead.phone,
        budget: lead.budget,
      },
    };
    // 4. Call Python AI Service with retry
    let aiResponse;
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const response = await axios.post(`${aiServiceUrl}/chat`, payload, { timeout: 10000 });
        aiResponse = response.data;
        break;
      } catch (err: any) {
        attempt++;
        console.error(`Attempt ${attempt} to connect to AI Service chat failed: ${err.message}`);
        if (attempt >= maxRetries) {
          aiResponse = {
            response: "I'm experiencing connectivity issues. May I get your name and email so our human agent can reach out?",
            intent: 'Support',
            extracted_name: null,
            extracted_email: null,
            extracted_phone: null,
            extracted_budget: null,
            extracted_appointment_date: null,
            extracted_appointment_time: null,
            lead_score: 'COLD',
            lead_sentiment: 'Neutral',
            engagement_score: 10,
          };
        } else {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
      }
    }

    await this.postProcessAIResponse(lead, conversation, businessId, messageHistory, aiResponse);

    return {
      response: aiResponse.response,
      intent: aiResponse.intent,
      leadId: lead.id,
      conversationId: conversation.id,
      lead,
    };
  }

  async streamMessage(dto: SendMessageDto, res: any) {
    const { message, businessId, leadId: inputLeadId, conversationId: inputConvId, channel } = dto;

    let lead;
    if (inputLeadId) {
      lead = await this.prisma.lead.findUnique({ where: { id: inputLeadId } });
    }
    if (!lead) {
      lead = await this.prisma.lead.create({
        data: {
          businessId,
          name: 'Anonymous Visitor',
          source: channel || 'WIDGET',
          status: 'COLD',
        },
      });
    }

    let conversation;
    if (inputConvId) {
      conversation = await this.prisma.conversation.findUnique({ where: { id: inputConvId } });
    }
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          leadId: lead.id,
          businessId,
          messages: '[]',
          channel: channel || 'WIDGET',
        },
      });
    }

    if (conversation?.isHumanTakeover) {
      const messageHistory = JSON.parse(conversation.messages);
      messageHistory.push({ role: 'user', content: message });
      
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          leadId: lead.id,
          messages: JSON.stringify(messageHistory),
        },
      });

      const chunk = JSON.stringify({
        text: 'A live agent is currently typing...',
        metadata: {
          intent: 'HumanTakeoverActive',
          leadId: lead.id,
          conversationId: conversation.id,
          lead,
          isHumanTakeover: true,
        }
      });
      res.write(`data: ${chunk}\n\n`);
      res.end();
      return;
    }

    const messageHistory = JSON.parse(conversation.messages);
    messageHistory.push({ role: 'user', content: message });

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { knowledgeBases: true },
    });
    if (!business) {
      throw new Error('Business profile not found');
    }

    let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
      aiServiceUrl = `http://${aiServiceUrl}`;
    }
    const payload = {
      messages: messageHistory,
      business_info: {
        companyName: business.companyName,
        website: business.website,
        industry: business.industry,
        description: business.description,
        agentTone: business.agentTone,
        agentPrompt: business.agentPrompt,
      },
      faqs: business.knowledgeBases.map((kb) => ({
        title: kb.title,
        content: kb.content,
      })),
      current_lead: {
        name: lead.name === 'Anonymous Visitor' ? null : lead.name,
        email: lead.email,
        phone: lead.phone,
        budget: lead.budget,
      },
    };

    let streamResponse;
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        streamResponse = await axios.post(`${aiServiceUrl}/chat/stream`, payload, {
          responseType: 'stream',
          timeout: 15000,
        });
        break;
      } catch (err: any) {
        attempt++;
        console.error(`Attempt ${attempt} to connect to AI Service stream failed: ${err.message}`);
        if (attempt >= maxRetries) {
          console.warn('AI Service streaming failed. Falling back to mock stream.');
          try {
            const mockService = new (require('../../../ai-service/app/services/agent').AIAgentService)();
            const generator = mockService.process_chat_stream(
              payload.messages,
              payload.business_info,
              payload.faqs,
              payload.current_lead
            );

            let fullMockText = "";
            let finalMetadata: any = null;

            for (const chunk of generator) {
              res.write(chunk);
              if (chunk.startsWith("data: ")) {
                try {
                  const parsed = JSON.parse(chunk.replace("data: ", "").trim());
                  if (parsed.text) fullMockText += parsed.text;
                  if (parsed.metadata) finalMetadata = parsed.metadata;
                } catch (e) {}
              }
            }

            if (finalMetadata) {
              await this.postProcessAIResponse(lead, conversation, businessId, messageHistory, {
                response: fullMockText,
                ...finalMetadata
              });
            }
          } catch (mockErr) {
            console.error('Failed to run mock stream:', mockErr);
            res.write(`data: {"text": "I am having trouble connecting right now."}\n\n`);
          }
          res.end();
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }

    let fullText = '';
    let metadata: any = null;

    streamResponse.data.on('data', (chunk: Buffer) => {
      const chunkStr = chunk.toString();
      res.write(chunkStr);

      const lines = chunkStr.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const dataStr = line.substring(6).trim();
            const data = JSON.parse(dataStr);
            if (data.text) {
              fullText += data.text;
            }
            if (data.metadata) {
              metadata = data.metadata;
            }
          } catch (e) {
            // ignore partial JSON parse errors
          }
        }
      }
    });

    streamResponse.data.on('end', async () => {
      try {
        if (metadata) {
          await this.postProcessAIResponse(lead, conversation, businessId, messageHistory, {
            response: fullText,
            ...metadata
          });
        }
      } catch (err) {
        console.error('Error post-processing stream metadata:', err);
      } finally {
        res.end();
      }
    });

    streamResponse.data.on('error', (err) => {
      console.error('AI Stream Error:', err);
      res.end();
    });
  }

  private async postProcessAIResponse(
    lead: any,
    conversation: any,
    businessId: string,
    messageHistory: any[],
    aiResponse: any
  ) {
    const updateData: any = {};
    if (aiResponse.extracted_name && (lead.name === 'Anonymous Visitor' || !lead.name)) {
      updateData.name = aiResponse.extracted_name;
    }
    if (aiResponse.extracted_email) {
      updateData.email = aiResponse.extracted_email;
    }
    if (aiResponse.extracted_phone) {
      updateData.phone = aiResponse.extracted_phone;
    }
    if (aiResponse.extracted_budget) {
      updateData.budget = aiResponse.extracted_budget;
    }
    if (aiResponse.lead_score) {
      updateData.status = aiResponse.lead_score;
    }
    if (aiResponse.lead_sentiment) {
      updateData.sentiment = aiResponse.lead_sentiment;
    }
    if (aiResponse.engagement_score !== undefined && aiResponse.engagement_score !== null) {
      updateData.engagementScore = aiResponse.engagement_score;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: updateData,
      });
    }

    if (aiResponse.extracted_appointment_date && aiResponse.extracted_appointment_time) {
      const existingAppt = await this.prisma.appointment.findFirst({
        where: {
          leadId: lead.id,
          date: aiResponse.extracted_appointment_date,
          time: aiResponse.extracted_appointment_time,
        },
      });

      if (!existingAppt) {
        await this.prisma.appointment.create({
          data: {
            leadId: lead.id,
            businessId,
            date: aiResponse.extracted_appointment_date,
            time: aiResponse.extracted_appointment_time,
            status: 'PENDING',
          },
        });
      }
    }

    messageHistory.push({ role: 'model', content: aiResponse.response });
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        leadId: lead.id,
        messages: JSON.stringify(messageHistory),
      },
    });
  }

  // --- Manual Human Agent Reply ---
  async sendOperatorReply(conversationId: string, message: string) {
    let conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messageHistory = JSON.parse(conversation.messages);
    messageHistory.push({ role: 'model', content: message });

    conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messages: JSON.stringify(messageHistory),
      },
    });

    return {
      success: true,
      conversation,
    };
  }

  // --- Simulate Multi-Channel Incoming Message ---
  async simulateIncomingMessage(dto: {
    businessId: string;
    channel: string;
    message: string;
    leadName?: string;
    leadPhone?: string;
    leadEmail?: string;
  }) {
    const { businessId, channel, message, leadName, leadPhone, leadEmail } = dto;

    // 1. Find or create Lead
    let lead;
    if (leadPhone) {
      lead = await this.prisma.lead.findFirst({
        where: { businessId, phone: leadPhone },
      });
    } else if (leadEmail) {
      lead = await this.prisma.lead.findFirst({
        where: { businessId, email: leadEmail },
      });
    }

    if (!lead) {
      lead = await this.prisma.lead.create({
        data: {
          businessId,
          name: leadName || 'Simulated User',
          phone: leadPhone || null,
          email: leadEmail || null,
          source: channel,
          status: 'COLD',
        },
      });
    }

    // 2. Find or create Conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: { leadId: lead.id, businessId, channel },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          leadId: lead.id,
          businessId,
          channel,
          messages: '[]',
        },
      });
    }

    // 3. Call standard sendMessage logic to save and run AI response
    return this.sendMessage({
      message,
      businessId,
      leadId: lead.id,
      conversationId: conversation.id,
      channel,
    });
  }
}
