import {
  IsBoolean,
  IsOptional,
  IsString,
  IsDefined,
  IsDate,
} from 'class-validator';

export class UpdatePlatformConfigDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  clientSecret?: string;

  @IsBoolean()
  @IsOptional()
  isConnected?: boolean;

  @IsDate()
  @IsOptional()
  connectedAt?: Date;

  @IsString()
  @IsOptional()
  lastError?: string | null;
}

export class PausePlatformDto {
  @IsString()
  @IsDefined()
  reason: string;

  @IsString()
  @IsOptional()
  resumeDate?: string;
}