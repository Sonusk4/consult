-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "enterpriseMemberId" INTEGER,
ALTER COLUMN "consultantId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Consultant" ADD COLUMN     "certificates" JSONB,
ADD COLUMN     "kyc_documents" JSONB,
ADD COLUMN     "kyc_status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "consultantReply" TEXT,
ADD COLUMN     "replied_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_enterpriseMemberId_fkey" FOREIGN KEY ("enterpriseMemberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
