/*
  Warnings:

  - A unique constraint covering the columns `[locationId,deliveryRouteCalculationDateId]` on the table `AssignLocationToTruck` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AssignLocationToTruck_locationId_truckByDateId_deliveryRout_key";

-- CreateIndex
CREATE UNIQUE INDEX "AssignLocationToTruck_locationId_deliveryRouteCalculationDa_key" ON "AssignLocationToTruck"("locationId", "deliveryRouteCalculationDateId");
