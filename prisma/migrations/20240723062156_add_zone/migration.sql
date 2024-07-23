-- DropForeignKey
ALTER TABLE "Truck" DROP CONSTRAINT "Truck_fuelId_fkey";

-- DropForeignKey
ALTER TABLE "Truck" DROP CONSTRAINT "Truck_truckSizeId_fkey";

-- DropForeignKey
ALTER TABLE "TruckAssistant" DROP CONSTRAINT "TruckAssistant_assistantId_fkey";

-- DropForeignKey
ALTER TABLE "TruckAssistant" DROP CONSTRAINT "TruckAssistant_truckId_fkey";

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "warehouseId" INTEGER,
ADD COLUMN     "zoneId" INTEGER,
ALTER COLUMN "truckSizeId" DROP NOT NULL,
ALTER COLUMN "fuelId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficerControll" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "OfficerControll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "information" TEXT NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneInfo" (
    "id" SERIAL NOT NULL,
    "truckAmount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "zoneId" INTEGER NOT NULL,
    "officerControllId" INTEGER,

    CONSTRAINT "ZoneInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zone_code_key" ON "Zone"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OfficerControll_name_key" ON "OfficerControll"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_name_key" ON "Warehouse"("name");

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_truckSizeId_fkey" FOREIGN KEY ("truckSizeId") REFERENCES "TruckSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_fuelId_fkey" FOREIGN KEY ("fuelId") REFERENCES "Fuel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckAssistant" ADD CONSTRAINT "TruckAssistant_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckAssistant" ADD CONSTRAINT "TruckAssistant_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "KeycloakAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneInfo" ADD CONSTRAINT "ZoneInfo_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneInfo" ADD CONSTRAINT "ZoneInfo_officerControllId_fkey" FOREIGN KEY ("officerControllId") REFERENCES "OfficerControll"("id") ON DELETE SET NULL ON UPDATE CASCADE;
