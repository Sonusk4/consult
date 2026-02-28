-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "user_commission_fee" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Consultant" ADD COLUMN     "consultant_commission_pct" DOUBLE PRECISION,
ADD COLUMN     "linkedin_url" TEXT,
ADD COLUMN     "platform_fee_pct" DOUBLE PRECISION NOT NULL DEFAULT 20,
ADD COLUMN     "subscription_expiry" TIMESTAMP(3),
ADD COLUMN     "subscription_plan" TEXT NOT NULL DEFAULT 'Free',
ADD COLUMN     "user_commission_pct" DOUBLE PRECISION,
ADD COLUMN     "website_url" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "chat_messages_used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_limit_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "purchased_chat_credits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subscription_expiry" TIMESTAMP(3),
ADD COLUMN     "subscription_plan" TEXT NOT NULL DEFAULT 'Free';

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "bonus_balance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ConsultantPayout" (
    "id" SERIAL NOT NULL,
    "consultantId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultantPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "default_consultant_comm" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "default_user_comm" DOUBLE PRECISION NOT NULL DEFAULT 10,

    CONSTRAINT "GlobalSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConsultantPayout" ADD CONSTRAINT "ConsultantPayout_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
