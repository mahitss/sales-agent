import { IsNotEmpty, IsUrl, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBusinessDto {
  @IsNotEmpty({ message: 'Company name is required' })
  @IsString()
  companyName: string;

  @IsNotEmpty({ message: 'Website URL is required' })
  @IsUrl({}, { message: 'Website must be a valid URL' })
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

  @IsOptional()
  @IsString()
  themeColor?: string;

  @IsOptional()
  @IsString()
  agentTone?: string;

  @IsOptional()
  @IsString()
  agentPrompt?: string;

  @IsOptional()
  @IsString()
  widgetGreeting?: string;

  @IsOptional()
  @IsString()
  widgetRules?: string;

  @IsOptional()
  @IsString()
  widgetPosition?: string;
}

export class CreateFAQDto {
  @IsNotEmpty({ message: 'FAQ title is required' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'FAQ content is required' })
  @IsString()
  content: string;
}
