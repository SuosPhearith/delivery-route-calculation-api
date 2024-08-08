-- DropForeignKey
ALTER TABLE "GroupLocation" DROP CONSTRAINT "GroupLocation_deliveryRouteCalculationDateId_fkey";

-- AlterTable
ALTER TABLE "GroupLocation" ALTER COLUMN "deliveryRouteCalculationDateId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GroupLocation" ADD CONSTRAINT "GroupLocation_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
