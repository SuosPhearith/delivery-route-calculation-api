/*
  Warnings:

  - You are about to drop the `DeliveryRouteCalculationDateGroupLocation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deliveryRouteCalculationDateId` to the `GroupLocation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DeliveryRouteCalculationDateGroupLocation" DROP CONSTRAINT "DeliveryRouteCalculationDateGroupLocation_deliveryRouteCal_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryRouteCalculationDateGroupLocation" DROP CONSTRAINT "DeliveryRouteCalculationDateGroupLocation_groupLocationId_fkey";

-- AlterTable
ALTER TABLE "GroupLocation" ADD COLUMN     "deliveryRouteCalculationDateId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "DeliveryRouteCalculationDateGroupLocation";

-- AddForeignKey
ALTER TABLE "GroupLocation" ADD CONSTRAINT "GroupLocation_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
