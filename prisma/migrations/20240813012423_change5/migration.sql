-- DropForeignKey
ALTER TABLE "AssignLocationToTruck" DROP CONSTRAINT "AssignLocationToTruck_deliveryRouteCalculationDateId_fkey";

-- AddForeignKey
ALTER TABLE "AssignLocationToTruck" ADD CONSTRAINT "AssignLocationToTruck_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
