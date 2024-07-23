/*
  Warnings:

  - You are about to drop the column `userId` on the `Truck` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Truck" DROP CONSTRAINT "Truck_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Truck" DROP CONSTRAINT "Truck_userId_fkey";

-- DropForeignKey
ALTER TABLE "TruckAssistant" DROP CONSTRAINT "TruckAssistant_assistantId_fkey";

-- AlterTable
ALTER TABLE "Truck" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "KeycloakAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckAssistant" ADD CONSTRAINT "TruckAssistant_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "KeycloakAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
