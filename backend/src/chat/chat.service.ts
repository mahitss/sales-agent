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

    // 4. Call Python AI Service
    let aiResponse;
    try {
      const response = await axios.post(`${aiServiceUrl}/chat`, payload, { timeout: 5000 });
      aiResponse = response.data;
    } catch (err) {
      console.error('Failed to communicate with AI Service:', err instanceof Error ? err.message : String(err));
      // Fallback response
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
    }

    // 5. Update Lead details in DB based on AI extractions
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
      lead = await this.prisma.lead.update({
        where: { id: lead.id },
        data: updateData,
      });
    }

    // 6. Check for appointment extraction
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

    // 7. Save conversation history
    messageHistory.push({ role: 'model', content: aiResponse.response });
    conversation = await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        leadId: lead.id,
        messages: JSON.stringify(messageHistory),
      },
    });

    return {
      response: aiResponse.response,
      intent: aiResponse.intent,
      leadId: lead.id,
      conversationId: conversation.id,
      lead,
    };
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
