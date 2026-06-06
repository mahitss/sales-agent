import { IsNotEmpty, IsUrl, IsString } from 'class-validator';

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
}

export class CreateFAQDto {
  @IsNotEmpty({ message: 'FAQ title is required' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'FAQ content is required' })
  @IsString()
  content: string;
}
