import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { CustomerStatus } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;
}