import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CustomerManagementModule } from './customer-management/customer-management.module';
import { AuthMiddleware } from '@gitroom/backend/services/auth/auth.middleware';
import { CustomersController } from './customer-management/controllers/customers.controller';

@Module({
  imports: [
    CustomerManagementModule,
    // Add future custom modules here
  ],
  exports: [
    CustomerManagementModule,
  ],
  providers: [AuthMiddleware],
})
export class CustomModulesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(CustomersController);
  }
}