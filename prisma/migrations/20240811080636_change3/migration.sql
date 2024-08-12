/*
  Warnings:

  - A unique constraint covering the columns `[locationId,truckByDateId,deliveryRouteCalculationDateId]` on the table `AssignLocationToTruck` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AssignLocationToTruck_locationId_truckByDateId_deliveryRout_key" ON "AssignLocationToTruck"("locationId", "truckByDateId", "deliveryRouteCalculationDateId");
