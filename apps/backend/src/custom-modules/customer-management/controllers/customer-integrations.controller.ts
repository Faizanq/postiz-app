import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { User } from '@prisma/client';
import { CustomerIntegrationsService } from '../services/customer-integrations.service';
import { CheckPolicies } from '@gitroom/backend/services/auth/permissions/permissions.ability';
import {
  AuthorizationActions,
  Sections,
} from '@gitroom/backend/services/auth/permissions/permissions.service';

@ApiTags('Customer Integrations')
@ApiBearerAuth()
@Controller('customer-integrations')
export class CustomerIntegrationsController {
  constructor(
    private readonly customerIntegrationsService: CustomerIntegrationsService
  ) {}

  @Get(':customerId/social/:provider')
  @ApiOperation({ summary: 'Generate OAuth URL for customer-specific integration' })
  @CheckPolicies([AuthorizationActions.Create, Sections.CHANNEL])
  async getCustomerIntegrationUrl(
    @GetOrgFromRequest() org: Organization,
    @Param('customerId') customerId: string,
    @Param('provider') provider: string,
    @Query('refresh') refresh?: string,
    @Query('externalUrl') externalUrl?: string
  ) {
    return this.customerIntegrationsService.generateCustomerOAuthUrl(
      org.id,
      customerId,
      provider,
      refresh,
      externalUrl
    );
  }

  @Post(':customerId/social/:provider/callback')
  @ApiOperation({ summary: 'Handle OAuth callback for customer integration' })
  @CheckPolicies([AuthorizationActions.Create, Sections.CHANNEL])
  async handleCustomerCallback(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('customerId') customerId: string,
    @Param('provider') provider: string,
    @Body() body: { code: string; state: string }
  ) {
    return this.customerIntegrationsService.handleOAuthCallback(
      org.id,
      user.id,
      customerId,
      provider,
      body.code,
      body.state
    );
  }

  @Get(':customerId/integrations')
  @ApiOperation({ summary: 'List all integrations for a customer' })
  @CheckPolicies([AuthorizationActions.Read, Sections.CHANNEL])
  async getCustomerIntegrations(
    @GetOrgFromRequest() org: Organization,
    @Param('customerId') customerId: string
  ) {
    return this.customerIntegrationsService.getCustomerIntegrations(
      org.id,
      customerId
    );
  }
}