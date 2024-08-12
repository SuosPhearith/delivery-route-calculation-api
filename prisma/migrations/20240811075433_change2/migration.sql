-- CreateTable
CREATE TABLE "AssignLocationToTruck" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "truckByDateId" INTEGER NOT NULL,
    "deliveryRouteCalculationDateId" INTEGER NOT NULL,

    CONSTRAINT "AssignLocationToTruck_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssignLocationToTruck" ADD CONSTRAINT "AssignLocationToTruck_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignLocationToTruck" ADD CONSTRAINT "AssignLocationToTruck_truckByDateId_fkey" FOREIGN KEY ("truckByDateId") REFERENCES "TruckByDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignLocationToTruck" ADD CONSTRAINT "AssignLocationToTruck_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
