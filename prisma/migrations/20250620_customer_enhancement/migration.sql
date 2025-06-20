-- AlterTable - Add new fields to Customer
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "contactName" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "planType" TEXT NOT NULL DEFAULT 'STARTER';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "onboardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable - CustomerPlatformConfig
CREATE TABLE IF NOT EXISTS "CustomerPlatformConfig" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "connectedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "pausedAt" TIMESTAMP(3),
    "pausedReason" TEXT,
    "resumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable - CustomerStatusHistory
CREATE TABLE IF NOT EXISTS "CustomerStatusHistory" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable - CustomerPlanHistory
CREATE TABLE IF NOT EXISTS "CustomerPlanHistory" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "fromPlan" TEXT,
    "toPlan" TEXT NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPlanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerPlatformConfig_customerId_platform_key" ON "CustomerPlatformConfig"("customerId", "platform");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_orgId_email_deletedAt_key" ON "Customer"("orgId", "email", "deletedAt");
CREATE INDEX IF NOT EXISTS "Customer_status_idx" ON "Customer"("status");
CREATE INDEX IF NOT EXISTS "Customer_planType_idx" ON "Customer"("planType");

-- AddForeignKey
ALTER TABLE "CustomerPlatformConfig" ADD CONSTRAINT "CustomerPlatformConfig_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerStatusHistory" ADD CONSTRAINT "CustomerStatusHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPlanHistory" ADD CONSTRAINT "CustomerPlanHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;