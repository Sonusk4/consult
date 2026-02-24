/*
  Warnings:

  - You are about to drop the column `name` on the `UserProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invite_token]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Enterprise" DROP CONSTRAINT "Enterprise_ownerId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "enterpriseId" INTEGER,
ADD COLUMN     "invite_token" TEXT,
ADD COLUMN     "invite_token_expiry" TIMESTAMP(3),
ADD COLUMN     "temp_password" TEXT,
ADD COLUMN     "temp_username" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "name";

-- CreateIndex
CREATE UNIQUE INDEX "User_invite_token_key" ON "User"("invite_token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enterprise" ADD CONSTRAINT "Enterprise_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
