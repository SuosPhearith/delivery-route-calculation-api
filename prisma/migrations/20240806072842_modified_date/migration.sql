/*
  Warnings:

  - You are about to drop the column `data` on the `DeliveryRouteCalculationDate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[date]` on the table `DeliveryRouteCalculationDate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `DeliveryRouteCalculationDate` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DeliveryRouteCalculationDate_data_key";

-- AlterTable
ALTER TABLE "DeliveryRouteCalculationDate" DROP COLUMN "data",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRouteCalculationDate_date_key" ON "DeliveryRouteCalculationDate"("date");
