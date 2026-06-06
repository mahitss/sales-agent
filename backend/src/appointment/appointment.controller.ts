import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/appointment.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('appointments')
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post()
  async create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(dto);
  }

  @UseGuards(AuthGuard)
  @Get('business/:businessId')
  async getByBusiness(@Param('businessId') businessId: string) {
    return this.appointmentService.getByBusiness(businessId);
  }

  @UseGuards(AuthGuard)
  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.appointmentService.updateStatus(id, dto.status);
  }
}
