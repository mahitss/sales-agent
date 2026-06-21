import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('email-templates')
@UseGuards(AuthGuard, TenantGuard)
export class EmailTemplateController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listTemplates(@Req() req: any) {
    const businessId = req.user.businessId;
    return this.prisma.emailTemplate.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Post()
  async createTemplate(
    @Body() body: { name: string; subject: string; body: string },
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;
    return this.prisma.emailTemplate.create({
      data: {
        businessId,
        name: body.name,
        subject: body.subject,
        body: body.body,
      },
    });
  }

  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: { name?: string; subject?: string; body?: string },
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;

    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.businessId !== businessId) {
      throw new ForbiddenException('Tenancy validation failed');
    }

    return this.prisma.emailTemplate.update({
      where: { id },
      data: {
        name: body.name,
        subject: body.subject,
        body: body.body,
      },
    });
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string, @Req() req: any) {
    const businessId = req.user.businessId;

    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.businessId !== businessId) {
      throw new ForbiddenException('Tenancy validation failed');
    }

    await this.prisma.emailTemplate.delete({
      where: { id },
    });

    return { success: true, message: 'Template deleted successfully' };
  }
}
