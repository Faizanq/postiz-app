import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomersRepository } from '../repositories/customers.repository';
import { CreateCustomerDto, CustomerStatus } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { ChangePlanDto } from '../dto/change-plan.dto';
import { UpdatePlatformConfigDto, PausePlatformDto } from '../dto/platform-config.dto';
import { OAuthValidatorService } from './oauth-validator.service';
import * as crypto from 'crypto';

@Injectable()
export class CustomersService {
  constructor(
    private customersRepository: CustomersRepository,
    private oauthValidator: OAuthValidatorService,
  ) {}

  async findAll(organizationId: string, filters?: {
    search?: string;
    status?: string;
    planType?: string;
  }) {
    return this.customersRepository.findAll(organizationId, filters);
  }

  async findOne(id: string, organizationId: string) {
    const customer = await this.customersRepository.findOne(id, organizationId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async create(organizationId: string, userId: string, createCustomerDto: CreateCustomerDto) {
    const { enabledPlatforms, ...customerData } = createCustomerDto;

    // Create customer
    const customer = await this.customersRepository.create(organizationId, customerData);

    // Create platform configs for enabled platforms
    if (enabledPlatforms && enabledPlatforms.length > 0) {
      await Promise.all(
        enabledPlatforms.map(platform => 
          this.customersRepository.createPlatformConfig(customer.id, platform, {
            isEnabled: true,
          })
        )
      );
    }

    // Create initial status history
    await this.customersRepository.createStatusHistory(
      customer.id,
      null,
      CustomerStatus.ACTIVE,
      userId,
      'Customer created'
    );

    return this.findOne(customer.id, organizationId);
  }

  async update(id: string, organizationId: string, userId: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(id, organizationId);
    
    const { status, ...updateData } = updateCustomerDto;
    const updatePayload: any = { ...updateData };

    // If status is changing, create history
    if (status && status !== customer.status) {
      await this.customersRepository.createStatusHistory(
        id,
        customer.status,
        status,
        userId
      );

      // Update deactivatedAt if status is changing to inactive
      if (status === CustomerStatus.INACTIVE) {
        updatePayload.deactivatedAt = new Date();
      } else if (customer.status === CustomerStatus.INACTIVE) {
        updatePayload.deactivatedAt = null;
      }
    }

    if (status) {
      updatePayload.status = status;
    }

    return this.customersRepository.update(id, organizationId, updatePayload);
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.customersRepository.softDelete(id, organizationId);
  }

  async changePlan(id: string, organizationId: string, userId: string, changePlanDto: ChangePlanDto) {
    const customer = await this.findOne(id, organizationId);
    
    if (customer.planType === changePlanDto.newPlan) {
      throw new BadRequestException('Customer is already on this plan');
    }

    // Create plan history
    await this.customersRepository.createPlanHistory(
      id,
      customer.planType,
      changePlanDto.newPlan,
      userId,
      changePlanDto.reason
    );

    // Update customer plan
    return this.customersRepository.update(id, organizationId, {
      planType: changePlanDto.newPlan,
    });
  }

  async updatePlatformConfig(
    customerId: string,
    platform: string,
    organizationId: string,
    updateDto: UpdatePlatformConfigDto
  ) {
    await this.findOne(customerId, organizationId);

    // Validate OAuth credentials if provided
    if (updateDto.clientId && updateDto.clientSecret) {
      const validation = await this.oauthValidator.validateCredentials(
        platform,
        updateDto.clientId,
        updateDto.clientSecret
      );

      if (!validation.isValid) {
        throw new BadRequestException(
          validation.error || 'Invalid OAuth credentials'
        );
      }
    }

    // Encrypt client secret if provided
    const updateData = { ...updateDto };
    if (updateData.clientSecret) {
      updateData.clientSecret = this.encryptSecret(updateData.clientSecret);
    }

    // Mark as connected if credentials are valid
    if (updateDto.clientId && updateDto.clientSecret) {
      updateData.isConnected = true;
      updateData.connectedAt = new Date();
      updateData.lastError = null;
    }

    return this.customersRepository.updatePlatformConfig(customerId, platform, updateData);
  }

  async pausePlatform(
    customerId: string,
    platform: string,
    organizationId: string,
    pauseDto: PausePlatformDto
  ) {
    await this.findOne(customerId, organizationId);

    return this.customersRepository.updatePlatformConfig(customerId, platform, {
      isActive: false,
      pausedAt: new Date(),
      pausedReason: pauseDto.reason,
      resumedAt: pauseDto.resumeDate ? new Date(pauseDto.resumeDate) : null,
    });
  }

  async resumePlatform(
    customerId: string,
    platform: string,
    organizationId: string
  ) {
    await this.findOne(customerId, organizationId);

    return this.customersRepository.updatePlatformConfig(customerId, platform, {
      isActive: true,
      resumedAt: new Date(),
      pausedAt: null,
      pausedReason: null,
    });
  }

  private encryptSecret(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptSecret(encrypted: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-key', 'salt', 32);
    
    const [ivHex, encryptedText] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async testPlatformCredentials(
    customerId: string,
    platform: string,
    organizationId: string,
    testDto: { clientId: string; clientSecret: string }
  ) {
    // Ensure customer exists
    await this.findOne(customerId, organizationId);

    // Validate credentials
    const validation = await this.oauthValidator.validateCredentials(
      platform,
      testDto.clientId,
      testDto.clientSecret
    );

    return {
      isValid: validation.isValid,
      error: validation.error,
      platform,
    };
  }
}