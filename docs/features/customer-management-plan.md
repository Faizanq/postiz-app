# Enhanced Customer Management Feature Plan

## Overview
Transform the basic customer feature into a comprehensive client management system for agencies.

## Database Schema Changes

### 1. Enhanced Customer Model
```prisma
model Customer {
  id             String        @id @default(uuid())
  
  // Basic Info
  name           String        // Company/Agency name
  email          String?
  phone          String?
  website        String?
  
  // Contact Person
  contactName    String?
  contactEmail   String?
  contactPhone   String?
  
  // Business Info
  planType       CustomerPlan  @default(STARTER)
  status         CustomerStatus @default(ACTIVE)
  
  // Important Dates
  onboardedAt    DateTime      @default(now())
  lastActiveAt   DateTime?
  deactivatedAt  DateTime?
  
  // Relationships
  orgId          String
  organization   Organization  @relation(fields: [orgId], references: [id])
  integrations   Integration[]
  
  // Social Platform Configuration
  platformConfigs CustomerPlatformConfig[]
  
  // Activity History
  statusHistory  CustomerStatusHistory[]
  planHistory    CustomerPlanHistory[]
  
  // Metadata
  notes          String?
  tags           String[]      @default([])
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  @@unique([orgId, email, deletedAt])
  @@unique([orgId, name, deletedAt])
  @@index([status])
  @@index([planType])
}

// Platform-specific configuration
model CustomerPlatformConfig {
  id         String   @id @default(uuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  
  platform   String   // 'twitter', 'facebook', 'linkedin', etc.
  isEnabled  Boolean  @default(false)
  isActive   Boolean  @default(true)  // Can be turned on/off anytime
  
  // OAuth credentials (encrypted)
  clientId     String?
  clientSecret String?  // Encrypted
  
  // Connection status
  isConnected  Boolean @default(false)
  connectedAt  DateTime?
  lastError    String?
  
  // Pause/Resume tracking
  pausedAt     DateTime?
  pausedReason String?
  resumedAt    DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([customerId, platform])
}

// Track status changes
model CustomerStatusHistory {
  id         String         @id @default(uuid())
  customerId String
  customer   Customer       @relation(fields: [customerId], references: [id])
  
  fromStatus CustomerStatus?
  toStatus   CustomerStatus
  reason     String?
  changedBy  String         // userId
  
  createdAt  DateTime       @default(now())
}

// Track plan changes
model CustomerPlanHistory {
  id         String       @id @default(uuid())
  customerId String
  customer   Customer     @relation(fields: [customerId], references: [id])
  
  fromPlan   CustomerPlan?
  toPlan     CustomerPlan
  reason     String?
  changedBy  String       // userId
  
  createdAt  DateTime     @default(now())
}

enum CustomerPlan {
  STARTER
  SOCIAL_COMBO
  PROFESSIONAL
  ENTERPRISE
}

enum CustomerStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING
}
```

## Frontend Implementation

### 1. Navigation Update
Add "Customers" menu item in TopMenu component with icon and proper routing.

### 2. Customer List Page (`/customers`)
- **Grid/Table View**:
  - Customer Info (Name, Email, Phone - combined column)
  - Connected Platforms (icons with status)
  - Plan Type (badge style)
  - Status (Active/Inactive with dates)
  - Actions (Edit, View Details, Delete)
  
- **Features**:
  - Search by name, email, phone
  - Filter by plan, status, platforms
  - Sort by name, created date, status
  - Bulk actions (activate/deactivate)
  - Export to CSV

### 3. Create Customer Modal
- **Fields**:
  - Company/Agency Name*
  - Contact Email*
  - Contact Phone
  - Website
  - Contact Person Details
  - Plan Selection (dropdown)
  - Platform Selection (grid of checkboxes)
  - Notes
  
### 4. Customer Edit Page (`/customers/:id/edit`)
- **Sections**:
  1. Basic Information (editable)
  2. Plan Management (upgrade/downgrade)
  3. Platform Configuration (cards for each selected platform)
  4. Integration Status
  5. Activity History
  6. Plan History

- **Plan Management Section**:
  - Current Plan Display with features
  - Upgrade/Downgrade buttons
  - Plan comparison modal
  - Effective date selection
  - Proration display
  - Confirmation workflow

- **Platform Configuration Cards**:
  - Platform Logo & Name
  - Client ID field
  - Client Secret field (masked)
  - Connection Status (warning/success)
  - Test Connection button
  - Update Credentials button
  - **Active/Pause Toggle** (to temporarily disable platform)
  - Pause Reason field (when pausing)
  - Last Activity timestamp

### 5. Customer Detail View (`/customers/:id`)
- Overview stats
- Connected integrations list
- Recent posts
- Analytics summary
- Activity timeline

## Backend Implementation

### 1. Customer Controller (`customers.controller.ts`)
```typescript
@Controller('customers')
export class CustomersController {
  // CRUD operations
  @Get() findAll(@Query() query: CustomerFilterDto)
  @Get(':id') findOne(@Param('id') id: string)
  @Post() create(@Body() createDto: CreateCustomerDto)
  @Put(':id') update(@Param('id') id: string, @Body() updateDto: UpdateCustomerDto)
  @Delete(':id') remove(@Param('id') id: string)
  
  // Status management
  @Post(':id/activate') activate(@Param('id') id: string)
  @Post(':id/deactivate') deactivate(@Param('id') id: string)
  
  // Plan management
  @Put(':id/plan') changePlan(
    @Param('id') id: string, 
    @Body() dto: ChangePlanDto
  )
  @Get(':id/plan-options') getPlanOptions(@Param('id') id: string)
  
  // Platform configuration
  @Get(':id/platforms') getPlatforms(@Param('id') id: string)
  @Put(':id/platforms/:platform') updatePlatform(
    @Param('id') id: string,
    @Param('platform') platform: string,
    @Body() updateDto: UpdatePlatformConfigDto
  )
  
  // Platform pause/resume
  @Post(':id/platforms/:platform/pause') pausePlatform(
    @Param('id') id: string,
    @Param('platform') platform: string,
    @Body() dto: PausePlatformDto
  )
  @Post(':id/platforms/:platform/resume') resumePlatform(
    @Param('id') id: string,
    @Param('platform') platform: string
  )
  
  // History
  @Get(':id/history') getHistory(@Param('id') id: string)
  
  // Analytics
  @Get(':id/analytics') getAnalytics(@Param('id') id: string)
}
```

### 2. DTOs
```typescript
// Create Customer
export class CreateCustomerDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsEnum(CustomerPlan) planType: CustomerPlan;
  @IsArray() @IsString({ each: true }) enabledPlatforms: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() tags?: string[];
}

// Update Platform Config
export class UpdatePlatformConfigDto {
  @IsOptional() @IsBoolean() isEnabled?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsString() clientSecret?: string;
}

// Change Plan
export class ChangePlanDto {
  @IsEnum(CustomerPlan) newPlan: CustomerPlan;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsDateString() effectiveDate?: string;
}

// Pause Platform
export class PausePlatformDto {
  @IsString() reason: string;
  @IsOptional() @IsDateString() resumeDate?: string;
}
```

### 3. Customer Service Enhancement
- Add encryption for client secrets
- Implement platform connection validation
- Add activity tracking
- Implement history recording

## UI/UX Flow

### 1. Customer Creation Flow
```
Customers Page → Create Button → Create Modal → Fill Details → Select Plan → 
Select Platforms → Save → Redirect to Edit Page → Configure Platform Credentials
```

### 2. Platform Configuration Flow
```
Customer Edit Page → Platform Card → Enter Credentials → Test Connection → 
Show Status → Save Credentials → Update Integration Status
```

### 3. Platform Pause/Resume Flow
```
Customer Edit Page → Platform Card → Toggle Active/Pause → 
If Pausing: Enter Reason → Confirm → Platform Disabled → 
Posts for this platform won't be scheduled
```

### 4. Plan Upgrade/Downgrade Flow
```
Customer Edit Page → Plan Section → Change Plan Button → 
Plan Comparison Modal → Select New Plan → Choose Effective Date → 
Review Changes → Confirm → Update Billing → Record in History
```

### 5. Customer Management Flow
```
Customers List → Search/Filter → Select Customer → View Details or Edit → 
Update Information → Save Changes → Track History
```

## Platform Management Features

### 1. Individual Platform Control
- **Pause/Resume**: Temporarily disable a platform without losing credentials
- **Reasons for Pausing**:
  - Client request
  - Payment issues
  - Platform policy violations
  - Seasonal campaigns
  - Budget constraints

### 2. Smart Platform Handling
- When platform is paused:
  - No posts scheduled to that platform
  - Existing scheduled posts marked with warning
  - Option to reschedule to other platforms
  - Analytics still visible but marked as "paused period"

### 3. Plan-Based Platform Limits
```typescript
const PLAN_FEATURES = {
  STARTER: {
    maxPlatforms: 3,
    availablePlatforms: ['twitter', 'facebook', 'linkedin']
  },
  SOCIAL_COMBO: {
    maxPlatforms: 5,
    availablePlatforms: ['twitter', 'facebook', 'linkedin', 'instagram', 'youtube']
  },
  PROFESSIONAL: {
    maxPlatforms: 10,
    availablePlatforms: 'all'
  },
  ENTERPRISE: {
    maxPlatforms: 'unlimited',
    availablePlatforms: 'all'
  }
}
```

## Security Considerations

1. **Credential Encryption**: All client secrets must be encrypted in database
2. **Access Control**: Only organization admins can manage customers
3. **Audit Trail**: Log all customer and credential changes
4. **Data Isolation**: Ensure customer data is properly isolated by organization

## Migration Strategy

1. Create new database tables
2. Migrate existing customer data to enhanced model
3. Update existing integrations to use new platform configs
4. Deploy backend changes
5. Deploy frontend changes
6. Document new features for users

## Future Enhancements

1. Customer portal (separate login for customers)
2. White-label options per customer
3. Customer-specific billing
4. Custom branding per customer
5. API access per customer
6. Customer-specific analytics dashboard