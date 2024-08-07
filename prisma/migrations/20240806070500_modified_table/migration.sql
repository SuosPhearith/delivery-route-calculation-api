/*
  Warnings:

  - You are about to drop the `LocationProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `groupLocationId` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LocationProduct" DROP CONSTRAINT "LocationProduct_locationId_fkey";

-- DropForeignKey
ALTER TABLE "LocationProduct" DROP CONSTRAINT "LocationProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_caseSizeId_fkey";

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "groupLocationId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "LocationProduct";

-- DropTable
DROP TABLE "Product";

-- CreateTable
CREATE TABLE "GroupLocation" (
    "id" SERIAL NOT NULL,
    "group" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "caseSizeId" INTEGER NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupLocation_group_key" ON "GroupLocation"("group");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_groupLocationId_fkey" FOREIGN KEY ("groupLocationId") REFERENCES "GroupLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_caseSizeId_fkey" FOREIGN KEY ("caseSizeId") REFERENCES "CaseSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
