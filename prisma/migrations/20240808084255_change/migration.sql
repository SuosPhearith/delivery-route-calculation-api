-- AlterTable
ALTER TABLE "TruckByDate" ADD COLUMN     "deliveryRouteCalculationDateId" INTEGER;

-- AddForeignKey
ALTER TABLE "TruckByDate" ADD CONSTRAINT "TruckByDate_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
