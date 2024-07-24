/*
  Warnings:

  - You are about to drop the column `driverId` on the `Truck` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Truck" DROP CONSTRAINT "Truck_driverId_fkey";

-- AlterTable
ALTER TABLE "Truck" DROP COLUMN "driverId";

-- CreateTable
CREATE TABLE "TruckDriver" (
    "id" SERIAL NOT NULL,
    "truckId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,

    CONSTRAINT "TruckDriver_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TruckDriver" ADD CONSTRAINT "TruckDriver_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckDriver" ADD CONSTRAINT "TruckDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "KeycloakAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
