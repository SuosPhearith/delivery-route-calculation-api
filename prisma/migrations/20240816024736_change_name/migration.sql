/*
  Warnings:

  - You are about to drop the `authAssign` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "authAssign" DROP CONSTRAINT "authAssign_deliveryRouteCalculationDateId_fkey";

-- DropForeignKey
ALTER TABLE "authAssign" DROP CONSTRAINT "authAssign_locationId_fkey";

-- DropForeignKey
ALTER TABLE "authAssign" DROP CONSTRAINT "authAssign_truckSizeId_fkey";

-- DropForeignKey
ALTER TABLE "authAssign" DROP CONSTRAINT "authAssign_zoneId_fkey";

-- DropTable
DROP TABLE "authAssign";

-- CreateTable
CREATE TABLE "AutoAssign" (
    "id" SERIAL NOT NULL,
    "deliveryRouteCalculationDateId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "truckSizeId" INTEGER NOT NULL,
    "partOfDay" "PartOfDay" NOT NULL,
    "priority" "Priority" NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "AutoAssign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AutoAssign" ADD CONSTRAINT "AutoAssign_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAssign" ADD CONSTRAINT "AutoAssign_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAssign" ADD CONSTRAINT "AutoAssign_truckSizeId_fkey" FOREIGN KEY ("truckSizeId") REFERENCES "TruckSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAssign" ADD CONSTRAINT "AutoAssign_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
