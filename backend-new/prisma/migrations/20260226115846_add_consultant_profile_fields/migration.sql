-- AlterTable
ALTER TABLE "Consultant" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "expertise" JSONB,
ADD COLUMN     "years_experience" INTEGER;
