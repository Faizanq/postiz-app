import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { ChangePlanDto } from '../dto/change-plan.dto';
import { UpdatePlatformConfigDto, PausePlatformDto } from '../dto/platform-config.dto';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { CheckPolicies } from '@gitroom/backend/services/auth/permissions/permissions.ability';
import {
  AuthorizationActions,
  Sections,
} from '@gitroom/backend/services/auth/permissions/permissions.service';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'List of customers' })
  @CheckPolicies([AuthorizationActions.Read, Sections.ADMIN])
  async findAll(
    @GetOrgFromRequest() org: Organization,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('planType') planType?: string,
  ) {
    return this.customersService.findAll(org.id, {
      search,
      status,
      planType,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by id' })
  @ApiResponse({ status: 200, description: 'Customer details' })
  @CheckPolicies([AuthorizationActions.Read, Sections.ADMIN])
  async findOne(
    @Param('id') id: string,
    @GetOrgFromRequest() org: Organization,
  ) {
    return this.customersService.findOne(id, org.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new customer' })
  @ApiResponse({ status: 201, description: 'Customer created' })
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
  ) {
    return this.customersService.create(org.id, user.id, createCustomerDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated' })
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
  ) {
    return this.customersService.update(id, org.id, user.id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: 204, description: 'Customer deleted' })
  @CheckPolicies([AuthorizationActions.Delete, Sections.ADMIN])
  async remove(
    @Param('id') id: string,
    @GetOrgFromRequest() org: Organization,
  ) {
    await this.customersService.remove(id, org.id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate customer' })
  @ApiResponse({ status: 200, description: 'Customer activated' })
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  async activate(
    @Param('id') id: string,
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
  ) {
    return this.customersService.update(id, org.id, user.id, {
      status: 'ACTIVE' as any,
    });
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate customer' })
  @ApiResponse({ status: 200, description: 'Customer deactivated' })
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  async deactivate(
    @Param('id') id: string,
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
  ) {
    return this.customersService.update(id, org.id, user.id, {
      status: 'INACTIVE' as any,
    });
  }

  @Put(':id/plan')
  @ApiOperation({ summary: 'Change customer plan' })
  @ApiResponse({ status: 200, description: 'Plan changed' })
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  async changePlan(
    @Param('id') id: string,
    @Body() changePlanDto: ChangePlanDto,
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
  ) {
    return this.customersService.changePlan(id, org.id, user.id, changePlanDto);
  }

  @Get(':id/platforms')
  @ApiOperation({ summary: 'Get customer platform configurations' })
  @ApiResponse({ status: 200, description: 'Platform configurations' })
  @CheckPolicies([AuthorizationActions.Read, Sections.ADMIN])
  async getPlatforms(
    @Param('id') id: string,
    @GetOrgFromRequest() org: Organization,
  ) {
    const customer = await this.customersService.findOne(id, org.id);
    return customer.platformConfigs;
  }

  @Put(':id/platforms/:platform')
  @ApiOperation({ summary: 'Update platform configuration' })
  @ApiResponse({ status: 200, description: 'Platform configuration updated' })
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  async updatePlatform(
    @Param('id') id: string,
    @Param('platform') platform: string,
    @Body() updateDto: UpdatePlatformConfigDto,
    @GetOrgFromRequest() org: Organization,
  ) {
    return this.customersService.updatePlatformConfig(id, platform, org.id, updateDto);
  }

  @Post(':id/platforms/:platform/pause')
  @ApiOperation({ summary: 'Pause platform for customer' })
  @ApiResponse({ status: 200, description: 'Platform paused' })
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  async pausePlatform(
    @Param('id') id: string,
    @Param('platform') platform: string,
    @Body() pauseDto: PausePlatformDto,
    @GetOrgFromRequest() org: Organization,
  ) {
    return this.customersService.pausePlatform(id, platform, org.id, pauseDto);
  }

  @Post(':id/platforms/:platform/resume')
  @ApiOperation({ summary: 'Resume platform for customer' })
  @ApiResponse({ status: 200, description: 'Platform resumed' })
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  async resumePlatform(
    @Param('id') id: string,
    @Param('platform') platform: string,
    @GetOrgFromRequest() org: Organization,
  ) {
    return this.customersService.resumePlatform(id, platform, org.id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get customer history' })
  @ApiResponse({ status: 200, description: 'Customer history' })
  @CheckPolicies([AuthorizationActions.Read, Sections.ADMIN])
  async getHistory(
    @Param('id') id: string,
    @GetOrgFromRequest() org: Organization,
  ) {
    const customer = await this.customersService.findOne(id, org.id);
    return {
      statusHistory: customer.statusHistory,
      planHistory: customer.planHistory,
    };
  }

  @Post(':id/platforms/:platform/test')
  @ApiOperation({ summary: 'Test platform credentials without saving' })
  @ApiResponse({ status: 200, description: 'Credentials validation result' })
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  async testPlatformCredentials(
    @Param('id') id: string,
    @Param('platform') platform: string,
    @Body() testDto: { clientId: string; clientSecret: string },
    @GetOrgFromRequest() org: Organization,
  ) {
    return this.customersService.testPlatformCredentials(
      id,
      platform,
      org.id,
      testDto
    );
  }
}