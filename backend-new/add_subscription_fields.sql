-- Add subscription fields to consultant table
-- Run this manually in PostgreSQL to add missing subscription columns

ALTER TABLE "Consultant" 
ADD COLUMN "currentPlan" TEXT,
ADD COLUMN "subscriptionStatus" TEXT,
ADD COLUMN "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN "planFeatures" JSONB,
ADD COLUMN "paymentId" TEXT;

-- Verify the columns were added
\d "Consultant";
