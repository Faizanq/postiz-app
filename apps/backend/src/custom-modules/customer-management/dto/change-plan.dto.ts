import {
  IsEnum,
  IsOptional,
  IsString,
  IsDefined,
  IsDateString,
} from 'class-validator';
import { CustomerPlan } from './create-customer.dto';

export class ChangePlanDto {
  @IsEnum(CustomerPlan)
  @IsDefined()
  newPlan: CustomerPlan;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;
}