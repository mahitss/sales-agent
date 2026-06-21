import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class AppointmentService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    @Inject(forwardRef(() => WorkflowService))
    private workflowService: WorkflowService,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const appt = await this.prisma.appointment.create({
      data: {
        leadId: dto.leadId,
        businessId: dto.businessId,
        date: dto.date,
        time: dto.time,
        status: 'PENDING',
      },
    });
    await this.redisService
      .del(`business:${dto.businessId}:lead-stats`)
      .catch(() => {});

    // Workflow Trigger
    this.workflowService
      .trigger('MEETING_SCHEDULED', appt.businessId, appt)
      .catch(() => {});

    return appt;
  }

  async updateStatus(id: string, status: string) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
    await this.redisService
      .del(`business:${existing.businessId}:lead-stats`)
      .catch(() => {});
    return updated;
  }

  async getByBusiness(businessId: string) {
    return this.prisma.appointment.findMany({
      where: { businessId },
      include: { lead: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { lead: true, business: true },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }
}
