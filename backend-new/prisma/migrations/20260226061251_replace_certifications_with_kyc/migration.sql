/*
  Warnings:

  - You are about to drop the column `certifications` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "certifications",
ADD COLUMN     "address_proof_url" TEXT,
ADD COLUMN     "id_proof_url" TEXT,
ADD COLUMN     "kyc_documents" JSONB,
ADD COLUMN     "kyc_status" TEXT,
ADD COLUMN     "kyc_submitted_at" TIMESTAMP(3);
