-- CreateTable
CREATE TABLE "AutoTruck" (
    "id" SERIAL NOT NULL,
    "deliveryRouteCalculationDateId" INTEGER NOT NULL,
    "truckOwnershipTypeId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "truckSizeId" INTEGER NOT NULL,
    "truckId" INTEGER NOT NULL,

    CONSTRAINT "AutoTruck_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AutoTruck" ADD CONSTRAINT "AutoTruck_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoTruck" ADD CONSTRAINT "AutoTruck_truckOwnershipTypeId_fkey" FOREIGN KEY ("truckOwnershipTypeId") REFERENCES "TruckOwnershipType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoTruck" ADD CONSTRAINT "AutoTruck_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoTruck" ADD CONSTRAINT "AutoTruck_truckSizeId_fkey" FOREIGN KEY ("truckSizeId") REFERENCES "TruckSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoTruck" ADD CONSTRAINT "AutoTruck_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
