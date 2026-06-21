import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsService } from '../../jobs/jobs.service';

@Controller('email-sequences')
@UseGuards(AuthGuard, TenantGuard)
export class EmailSequenceController {
  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

  @Get()
  async listSequences(@Req() req: any) {
    const businessId = req.user.businessId;
    return this.prisma.emailSequence.findMany({
      where: { businessId },
      include: {
        enrollments: {
          select: { id: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post()
  async createSequence(
    @Body() body: { name: string; steps: any[] },
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;
    return this.prisma.emailSequence.create({
      data: {
        businessId,
        name: body.name,
        steps: body.steps || []
      }
    });
  }

  @Put(':id')
  async updateSequence(
    @Param('id') id: string,
    @Body() body: { name?: string; steps?: any[]; isEnabled?: boolean },
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;

    const sequence = await this.prisma.emailSequence.findUnique({
      where: { id }
    });

    if (!sequence) {
      throw new NotFoundException('Sequence not found');
    }

    if (sequence.businessId !== businessId) {
      throw new ForbiddenException('Tenancy validation failed');
    }

    return this.prisma.emailSequence.update({
      where: { id },
      data: {
        name: body.name,
        steps: body.steps,
        isEnabled: body.isEnabled
      }
    });
  }

  @Delete(':id')
  async deleteSequence(@Param('id') id: string, @Req() req: any) {
    const businessId = req.user.businessId;

    const sequence = await this.prisma.emailSequence.findUnique({
      where: { id }
    });

    if (!sequence) {
      throw new NotFoundException('Sequence not found');
    }

    if (sequence.businessId !== businessId) {
      throw new ForbiddenException('Tenancy validation failed');
    }

    await this.prisma.emailSequence.delete({
      where: { id }
    });

    return { success: true, message: 'Sequence deleted successfully' };
  }

  @Post(':id/enroll')
  async enrollLeads(
    @Param('id') id: string,
    @Body() body: { leadIds: string[] },
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;

    const sequence = await this.prisma.emailSequence.findUnique({
      where: { id }
    });

    if (!sequence) {
      throw new NotFoundException('Sequence not found');
    }

    if (sequence.businessId !== businessId) {
      throw new ForbiddenException('Tenancy validation failed');
    }

    const enrollments: any[] = [];

    for (const leadId of body.leadIds) {
      // Validate lead ownership
      const lead = await this.prisma.lead.findFirst({
        where: { id: leadId, businessId }
      });

      if (!lead) continue;

      // Check if lead is already enrolled with active status
      const existing = await this.prisma.emailSequenceEnrollment.findFirst({
        where: { sequenceId: id, leadId, status: 'ACTIVE' }
      });

      if (existing) {
        enrollments.push(existing);
        continue;
      }

      // Create new sequence enrollment
      const enrollment = await this.prisma.emailSequenceEnrollment.create({
        data: {
          sequenceId: id,
          leadId,
          currentStep: 0,
          status: 'ACTIVE',
          nextRunAt: new Date()
        }
      });

      // Dispatch step execution job with BullMQ immediately (delay: 0)
      await this.jobsService.addEmailSequenceExecutionJob(enrollment.id, businessId, 0);
      enrollments.push(enrollment);
    }

    return { success: true, count: enrollments.length, enrollments };
  }

  @Post(':id/disenroll')
  async disenrollLeads(
    @Param('id') id: string,
    @Body() body: { leadIds: string[] },
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;

    const sequence = await this.prisma.emailSequence.findUnique({
      where: { id }
    });

    if (!sequence) {
      throw new NotFoundException('Sequence not found');
    }

    if (sequence.businessId !== businessId) {
      throw new ForbiddenException('Tenancy validation failed');
    }

    const result = await this.prisma.emailSequenceEnrollment.updateMany({
      where: {
        sequenceId: id,
        leadId: { in: body.leadIds }
      },
      data: {
        status: 'PAUSED',
        updatedAt: new Date()
      }
    });

    return { success: true, count: result.count };
  }
}
