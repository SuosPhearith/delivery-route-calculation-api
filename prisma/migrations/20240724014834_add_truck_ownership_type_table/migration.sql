-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "functioning" TEXT,
ADD COLUMN     "truckOwnershipTypeId" INTEGER;

-- CreateTable
CREATE TABLE "TruckOwnershipType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "TruckOwnershipType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TruckOwnershipType_name_key" ON "TruckOwnershipType"("name");

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_truckOwnershipTypeId_fkey" FOREIGN KEY ("truckOwnershipTypeId") REFERENCES "TruckOwnershipType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
