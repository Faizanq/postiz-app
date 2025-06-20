import {
  IsDefined,
  IsEmail,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum CustomerPlan {
  STARTER = 'STARTER',
  SOCIAL_COMBO = 'SOCIAL_COMBO',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export class CreateCustomerDto {
  @IsString()
  @IsDefined()
  @MinLength(2)
  @MaxLength(128)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEnum(CustomerPlan)
  @IsDefined()
  planType: CustomerPlan;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  enabledPlatforms?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}