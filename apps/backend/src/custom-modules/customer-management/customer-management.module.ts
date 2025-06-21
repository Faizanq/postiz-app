import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CustomersController } from './controllers/customers.controller';
import { CustomersService } from './services/customers.service';
import { CustomersRepository } from './repositories/customers.repository';
import { OAuthValidatorService } from './services/oauth-validator.service';
import { CustomerIntegrationsController } from './controllers/customer-integrations.controller';
import { CustomerIntegrationsService } from './services/customer-integrations.service';
import { PrismaRepository, PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { DatabaseModule } from '@gitroom/nestjs-libraries/database/prisma/database.module';
import { IntegrationManager } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { AuthMiddleware } from '@gitroom/backend/services/auth/auth.middleware';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomersController, CustomerIntegrationsController],
  providers: [
    CustomersService,
    CustomersRepository,
    OAuthValidatorService,
    CustomerIntegrationsService,
    IntegrationManager,
    IntegrationService,
    AuthMiddleware,
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
export class CustomerManagementModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(CustomersController, CustomerIntegrationsController);
  }
}