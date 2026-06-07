import { IsNotEmpty, IsUrl, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBusinessDto {
  @IsNotEmpty({ message: 'Company name is required' })
  @IsString()
  companyName: string;

  @IsNotEmpty({ message: 'Website URL is required' })
  @IsString()
  website: string;

  @IsNotEmpty({ message: 'Industry is required' })
  @IsString()
  industry: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  instagramEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsString()
  whatsappApiKey?: string;

  @IsOptional()
  @IsString()
  instagramAccountId?: string;

  @IsOptional()
  @IsString()
  emailSmtp?: string;
}

export class CreateFAQDto {
  @IsNotEmpty({ message: 'FAQ title is required' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'FAQ content is required' })
  @IsString()
  content: string;
}
