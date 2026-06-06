import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty({ message: 'Lead ID is required' })
  @IsString()
  leadId: string;

  @IsNotEmpty({ message: 'Business ID is required' })
  @IsString()
  businessId: string;

  @IsNotEmpty({ message: 'Date is required' })
  @IsString()
  date: string;

  @IsNotEmpty({ message: 'Time is required' })
  @IsString()
  time: string;
}

export class UpdateAppointmentStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsString()
  status: string; // PENDING, CONFIRMED, CANCELLED
}
