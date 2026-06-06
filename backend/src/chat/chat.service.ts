import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/chat.dto';
import axios from 'axios';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(dto: SendMessageDto) {
    const { message, businessId, leadId: inputLeadId, conversationId: inputConvId } = dto;

    // 1. Get or create Lead
    let lead;
    if (inputLeadId) {
      try {
        lead = await this.prisma.lead.findUnique({ where: { id: inputLeadId } });
      } catch (e) {
        lead = null;
      }
    }
    if (!lead) {
      lead = await this.prisma.lead.create({
        data: {
          businessId,
          name: 'Anonymous Visitor',
          status: 'COLD',
        },
      });
    }

    // 2. Get or create Conversation
    let conversation;
    if (inputConvId) {
      try {
        conversation = await this.prisma.conversation.findUnique({ where: { id: inputConvId } });
      } catch (e) {
        conversation = null;
      }
    }
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          leadId: lead.id,
          businessId,
          messages: '[]',
        },
      });
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
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const payload = {
      messages: messageHistory,
      business_info: {
        companyName: business.companyName,
        website: business.website,
        industry: business.industry,
        description: business.description,
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
      const response = await axios.post(`${aiServiceUrl}/chat`, payload);
      aiResponse = response.data;
    } catch (err) {
      console.error('Failed to communicate with AI Service:', err.message);
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
}
