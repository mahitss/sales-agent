import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, CreateFAQDto } from './dto/business.dto';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateBusinessDto) {
    return this.prisma.business.create({
      data: {
        ownerId,
        companyName: dto.companyName,
        website: dto.website,
        industry: dto.industry,
        description: dto.description,
      },
    });
  }

  async getForUser(ownerId: string) {
    const business = await this.prisma.business.findFirst({
      where: { ownerId },
      include: { knowledgeBases: true },
    });
    if (!business) {
      return null;
    }
    return business;
  }

  async getById(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { knowledgeBases: true },
    });
    if (!business) {
      throw new NotFoundException('Business profile not found');
    }
    return business;
  }

  async update(businessId: string, ownerId: string, dto: CreateBusinessDto) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business not found or access denied');
    }

    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        companyName: dto.companyName,
        website: dto.website,
        industry: dto.industry,
        description: dto.description,
      },
    });
  }

  async createFAQ(businessId: string, ownerId: string, dto: CreateFAQDto) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business not found or access denied');
    }

    return this.prisma.knowledgeBase.create({
      data: {
        businessId,
        title: dto.title,
        content: dto.content,
      },
    });
  }

  async getFAQs(businessId: string) {
    return this.prisma.knowledgeBase.findMany({
      where: { businessId },
    });
  }

  async deleteFAQ(faqId: string, ownerId: string) {
    const faq = await this.prisma.knowledgeBase.findUnique({
      where: { id: faqId },
      include: { business: true },
    });
    if (!faq || faq.business.ownerId !== ownerId) {
      throw new NotFoundException('FAQ not found or access denied');
    }

    await this.prisma.knowledgeBase.delete({
      where: { id: faqId },
    });
    return { success: true };
  }
}
