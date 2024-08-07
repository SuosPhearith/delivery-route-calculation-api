/*
  Warnings:

  - Added the required column `partOfDay` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PartOfDay" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT');

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "partOfDay" "PartOfDay" NOT NULL;

-- CreateTable
CREATE TABLE "DeliveryRouteCalculationDate" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryRouteCalculationDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryRouteCalculationDateGroupLocation" (
    "id" SERIAL NOT NULL,
    "deliveryRouteCalculationDateId" INTEGER NOT NULL,
    "groupLocationId" INTEGER NOT NULL,

    CONSTRAINT "DeliveryRouteCalculationDateGroupLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRouteCalculationDate_data_key" ON "DeliveryRouteCalculationDate"("data");

-- AddForeignKey
ALTER TABLE "DeliveryRouteCalculationDateGroupLocation" ADD CONSTRAINT "DeliveryRouteCalculationDateGroupLocation_deliveryRouteCal_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRouteCalculationDateGroupLocation" ADD CONSTRAINT "DeliveryRouteCalculationDateGroupLocation_groupLocationId_fkey" FOREIGN KEY ("groupLocationId") REFERENCES "GroupLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
