-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'TRIVIAL');

-- AlterTable
ALTER TABLE "TruckDriver" ADD COLUMN     "deliveryAmount" INTEGER;

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "documentDate" TEXT,
    "sla" TEXT,
    "updatedTime" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "se" TEXT NOT NULL,
    "homeNo" TEXT,
    "streetNo" TEXT,
    "village" TEXT,
    "sangkat" TEXT,
    "khan" TEXT,
    "hotSpot" TEXT,
    "direction" TEXT,
    "area" TEXT,
    "region" TEXT,
    "division" TEXT,
    "zoneId" INTEGER,
    "truckSizeId" INTEGER,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "paymentTerm" TEXT,
    "comments" TEXT,
    "priority" "Priority" NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "caseSizeId" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationProduct" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER,
    "productId" INTEGER,

    CONSTRAINT "LocationProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_truckSizeId_fkey" FOREIGN KEY ("truckSizeId") REFERENCES "TruckSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_caseSizeId_fkey" FOREIGN KEY ("caseSizeId") REFERENCES "CaseSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationProduct" ADD CONSTRAINT "LocationProduct_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationProduct" ADD CONSTRAINT "LocationProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
