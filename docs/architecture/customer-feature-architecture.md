# Customer Feature Architecture - Minimal Conflict Strategy

## Core Principle: Extend, Don't Modify

To ensure easy merging with upstream changes, we'll follow these architectural principles:

## 1. Database Strategy

### Use Separate Schema Files
Instead of modifying the main `schema.prisma`, create:

```
libraries/nestjs-libraries/src/database/prisma/
├── schema.prisma (original - don't modify)
└── schema-extensions/
    └── customer-management.prisma
```

### Migration Strategy
```bash
# Our migrations in separate folder
prisma/migrations-custom/
├── 001_customer_enhanced/
├── 002_platform_configs/
└── 003_plan_history/
```

## 2. Backend Architecture

### Separate Module Structure
```
apps/backend/src/
├── api/ (original modules - don't modify)
└── custom-modules/
    └── customer-management/
        ├── customer-management.module.ts
        ├── controllers/
        │   └── customers.controller.ts
        ├── services/
        │   ├── customers.service.ts
        │   └── platform-config.service.ts
        ├── dto/
        ├── entities/
        └── repositories/
```

### Module Registration
```typescript
// apps/backend/src/app.module.ts
// Add only one line to imports
import { CustomModulesModule } from './custom-modules/custom-modules.module';

@Module({
  imports: [
    // ... existing imports
    CustomModulesModule, // Our single addition
  ],
})
```

### Custom Modules Aggregator
```typescript
// apps/backend/src/custom-modules/custom-modules.module.ts
@Module({
  imports: [
    CustomerManagementModule,
    // Future custom modules here
  ],
  exports: [
    CustomerManagementModule,
  ],
})
export class CustomModulesModule {}
```

## 3. Frontend Architecture

### Separate Components Structure
```
apps/frontend/src/
├── components/ (original - don't modify)
├── app/ (original routes - don't modify)
└── custom-features/
    └── customer-management/
        ├── components/
        │   ├── CustomerList.tsx
        │   ├── CustomerForm.tsx
        │   ├── PlatformConfig.tsx
        │   └── PlanManagement.tsx
        ├── hooks/
        │   ├── useCustomers.ts
        │   └── usePlatformConfig.ts
        ├── services/
        │   └── customer.service.ts
        └── types/
            └── customer.types.ts
```

### Route Registration
```typescript
// apps/frontend/src/app/(app)/customers/page.tsx
// New file - doesn't conflict with existing routes
export { default } from '@/custom-features/customer-management/pages/CustomerListPage';
```

### Navigation Extension
```typescript
// Create a navigation extension file
// apps/frontend/src/custom-features/navigation-extensions.tsx
export const customMenuItems = [
  {
    name: 'Customers',
    href: '/customers',
    icon: UsersIcon,
    roles: ['ADMIN', 'SUPERADMIN'],
  },
];

// In TopMenu component, add one line:
import { customMenuItems } from '@/custom-features/navigation-extensions';
// Merge with existing items
```

## 4. API Integration Pattern

### Extend Existing Services
```typescript
// Don't modify existing integration service
// Create wrapper service
export class CustomerIntegrationService {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly customerService: CustomersService,
  ) {}

  async createIntegrationForCustomer(customerId: string, data: any) {
    // Our custom logic
    const customer = await this.customerService.findOne(customerId);
    // Call original service
    const integration = await this.integrationService.create(data);
    // Link to customer
    return this.linkIntegrationToCustomer(integration, customer);
  }
}
```

## 5. Configuration Strategy

### Separate Config Files
```
├── .env (original)
└── .env.custom
    # Our custom environment variables
    ENABLE_CUSTOMER_MANAGEMENT=true
    CUSTOMER_PLAN_FEATURES=true
```

### Feature Flags
```typescript
// apps/backend/src/custom-modules/config/custom-features.config.ts
export const customFeatures = {
  customerManagement: process.env.ENABLE_CUSTOMER_MANAGEMENT === 'true',
  platformPauseResume: process.env.ENABLE_PLATFORM_PAUSE === 'true',
};
```

## 6. Git Strategy

### Branch Structure
```
main (mirrors upstream)
├── custom-base (our stable custom features)
│   ├── feature/customer-management
│   ├── feature/platform-pause
│   └── feature/plan-management
└── development (active development)
```

### Merge Strategy
```bash
# Regular sync workflow
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# Merge to custom-base
git checkout custom-base
git merge main --strategy=ours --no-commit
# Manually review and accept changes
git commit

# Merge to feature branches
git checkout feature/customer-management
git rebase custom-base
```

## 7. File Organization Rules

### Never Modify These Files
- `schema.prisma` (use extensions)
- Core service files
- Original controllers
- Original React components
- Package.json dependencies (add in separate section)

### Safe to Add
- New folders under `custom-*` prefix
- New routes that don't exist
- New API endpoints with `/custom` prefix
- New database tables (don't modify existing)

## 8. Import Strategy

### Use Barrel Exports
```typescript
// custom-features/index.ts
export * from './customer-management';
export * from './navigation-extensions';
```

### Minimal Import Changes
```typescript
// In existing files, add only:
import { customFeatures } from '@/custom-features';
```

## 9. Testing Strategy

### Separate Test Suites
```
├── tests/ (original)
└── tests-custom/
    ├── customer-management/
    ├── platform-config/
    └── integration/
```

## 10. Build Configuration

### Webpack Aliases
```javascript
// apps/frontend/next.config.js
module.exports = {
  // ... existing config
  webpack: (config) => {
    config.resolve.alias['@custom'] = path.join(__dirname, 'src/custom-features');
    return config;
  },
};
```

## Conflict Resolution Checklist

When pulling from upstream:

1. ✅ Our custom folders remain untouched
2. ✅ Single-line additions easy to re-add if needed
3. ✅ Database migrations in separate folder
4. ✅ Custom routes don't conflict
5. ✅ Services extend, not modify
6. ✅ Config changes isolated

## Benefits

1. **Minimal Conflicts**: 90% of upstream changes won't affect our code
2. **Easy Updates**: Pull upstream changes without fear
3. **Clear Separation**: Easy to see what's custom vs original
4. **Maintainable**: New developers can understand the structure
5. **Reversible**: Can disable features via config