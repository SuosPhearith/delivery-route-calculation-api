/*
  Warnings:

  - You are about to drop the `ZoneInfo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ZoneInfo" DROP CONSTRAINT "ZoneInfo_officerControllId_fkey";

-- DropForeignKey
ALTER TABLE "ZoneInfo" DROP CONSTRAINT "ZoneInfo_zoneId_fkey";

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "officerControllId" INTEGER,
ADD COLUMN     "truckAmount" INTEGER;

-- DropTable
DROP TABLE "ZoneInfo";

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_officerControllId_fkey" FOREIGN KEY ("officerControllId") REFERENCES "OfficerControll"("id") ON DELETE SET NULL ON UPDATE CASCADE;
