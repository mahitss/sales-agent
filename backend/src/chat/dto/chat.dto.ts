import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @IsString()
  message: string;

  @IsNotEmpty({ message: 'Business ID is required' })
  @IsString()
  businessId: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}
