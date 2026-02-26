/*
  Warnings:

  - A unique constraint covering the columns `[permanent_username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password_changed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "permanent_password" TEXT,
ADD COLUMN     "permanent_username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_permanent_username_key" ON "User"("permanent_username");
