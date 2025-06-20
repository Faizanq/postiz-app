import { Module } from '@nestjs/common';
import { CustomersController } from './controllers/customers.controller';
import { CustomersService } from './services/customers.service';
import { CustomersRepository } from './repositories/customers.repository';
import { OAuthValidatorService } from './services/oauth-validator.service';
import { PrismaRepository, PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Module({
  controllers: [CustomersController],
  providers: [
    CustomersService,
    CustomersRepository,
    OAuthValidatorService,
    {
      provide: 'PrismaRepository<"customer">',
      useFactory: (prismaService: PrismaService) => new PrismaRepository<'customer'>(prismaService),
      inject: [PrismaService],
    },
    {
      provide: 'PrismaRepository<"customerPlatformConfig">',
      useFactory: (prismaService: PrismaService) => new PrismaRepository<'customerPlatformConfig'>(prismaService),
      inject: [PrismaService],
    },
    {
      provide: 'PrismaRepository<"customerStatusHistory">',
      useFactory: (prismaService: PrismaService) => new PrismaRepository<'customerStatusHistory'>(prismaService),
      inject: [PrismaService],
    },
    {
      provide: 'PrismaRepository<"customerPlanHistory">',
      useFactory: (prismaService: PrismaService) => new PrismaRepository<'customerPlanHistory'>(prismaService),
      inject: [PrismaService],
    },
  ],
  exports: [CustomersService],
})
export class CustomerManagementModule {}