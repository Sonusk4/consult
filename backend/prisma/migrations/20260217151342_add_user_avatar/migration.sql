-- AlterTable
ALTER TABLE "Consultant" ADD COLUMN     "profile_pic" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp_code" TEXT,
ADD COLUMN     "otp_expiry" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT;
