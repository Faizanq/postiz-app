import { Injectable, Inject } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersRepository {
  constructor(
    @Inject('PrismaRepository<"customer">') private _customer: PrismaRepository<'customer'>,
    @Inject('PrismaRepository<"customerPlatformConfig">') private _customerPlatformConfig: PrismaRepository<'customerPlatformConfig'>,
    @Inject('PrismaRepository<"customerStatusHistory">') private _customerStatusHistory: PrismaRepository<'customerStatusHistory'>,
    @Inject('PrismaRepository<"customerPlanHistory">') private _customerPlanHistory: PrismaRepository<'customerPlanHistory'>
  ) {}

  async findAll(organizationId: string, filters?: {
    search?: string;
    status?: string;
    planType?: string;
  }) {
    const where: Prisma.CustomerWhereInput = {
      orgId: organizationId,
      deletedAt: null,
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.planType && { planType: filters.planType }),
    };

    return this._customer.model.customer.findMany({
      where,
      include: {
        integrations: {
          select: {
            id: true,
            name: true,
            providerIdentifier: true,
            picture: true,
            disabled: true,
          },
        },
        platformConfigs: true,
        _count: {
          select: {
            integrations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this._customer.model.customer.findFirst({
      where: {
        id,
        orgId: organizationId,
        deletedAt: null,
      },
      include: {
        integrations: true,
        platformConfigs: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        planHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async create(organizationId: string, data: Omit<Prisma.CustomerCreateInput, 'organization'>) {
    return this._customer.model.customer.create({
      data: {
        ...data,
        organization: {
          connect: { id: organizationId },
        },
      },
    });
  }

  async update(id: string, organizationId: string, data: Prisma.CustomerUpdateInput) {
    return this._customer.model.customer.update({
      where: {
        id,
        orgId: organizationId,
      },
      data: {
        ...data,
        lastActiveAt: new Date(),
      },
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this._customer.model.customer.update({
      where: {
        id,
        orgId: organizationId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async createPlatformConfig(customerId: string, platform: string, data: Partial<{
    isEnabled: boolean;
    clientId: string;
    clientSecret: string;
  }>) {
    return this._customerPlatformConfig.model.customerPlatformConfig.upsert({
      where: {
        customerId_platform: {
          customerId,
          platform,
        },
      },
      create: {
        customerId,
        platform,
        ...data,
      },
      update: data,
    });
  }

  async updatePlatformConfig(customerId: string, platform: string, data: Prisma.CustomerPlatformConfigUpdateInput) {
    return this._customerPlatformConfig.model.customerPlatformConfig.update({
      where: {
        customerId_platform: {
          customerId,
          platform,
        },
      },
      data,
    });
  }

  async createStatusHistory(customerId: string, fromStatus: string | null, toStatus: string, changedBy: string, reason?: string) {
    return this._customerStatusHistory.model.customerStatusHistory.create({
      data: {
        customerId,
        fromStatus,
        toStatus,
        changedBy,
        reason,
      },
    });
  }

  async createPlanHistory(customerId: string, fromPlan: string | null, toPlan: string, changedBy: string, reason?: string) {
    return this._customerPlanHistory.model.customerPlanHistory.create({
      data: {
        customerId,
        fromPlan,
        toPlan,
        changedBy,
        reason,
      },
    });
  }
}