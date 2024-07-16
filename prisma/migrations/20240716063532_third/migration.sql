/*
  Warnings:

  - You are about to drop the column `avatar` on the `Assistant` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Assistant` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Driver` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Assistant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `Assistant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Driver` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Assistant" DROP CONSTRAINT "Assistant_userId_fkey";

-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_userId_fkey";

-- AlterTable
ALTER TABLE "Assistant" DROP COLUMN "avatar",
DROP COLUMN "name",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "avatar",
DROP COLUMN "name",
ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Assistant_userId_key" ON "Assistant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
