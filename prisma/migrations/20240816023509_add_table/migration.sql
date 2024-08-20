-- CreateTable
CREATE TABLE "authAssign" (
    "id" SERIAL NOT NULL,
    "deliveryRouteCalculationDateId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "truckSizeId" INTEGER NOT NULL,
    "partOfDay" "PartOfDay" NOT NULL,
    "priority" "Priority" NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "authAssign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "authAssign" ADD CONSTRAINT "authAssign_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authAssign" ADD CONSTRAINT "authAssign_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authAssign" ADD CONSTRAINT "authAssign_truckSizeId_fkey" FOREIGN KEY ("truckSizeId") REFERENCES "TruckSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authAssign" ADD CONSTRAINT "authAssign_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
