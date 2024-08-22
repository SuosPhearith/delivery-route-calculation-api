/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Location` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");
