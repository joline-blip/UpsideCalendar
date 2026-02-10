/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "markets" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "profileCompletedAt" TIMESTAMP(3);
