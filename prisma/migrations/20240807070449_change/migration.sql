/*
  Warnings:

  - You are about to drop the column `groupLocationId` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the `GroupLocation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deliveryRouteCalculationDateId` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GroupLocation" DROP CONSTRAINT "GroupLocation_deliveryRouteCalculationDateId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_groupLocationId_fkey";

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "groupLocationId",
ADD COLUMN     "deliveryRouteCalculationDateId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "GroupLocation";

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
