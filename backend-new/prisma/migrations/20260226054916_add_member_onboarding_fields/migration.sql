-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "certifications" JSONB,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "expertise" JSONB,
ADD COLUMN     "hourly_rate" DOUBLE PRECISION,
ADD COLUMN     "years_experience" INTEGER;
