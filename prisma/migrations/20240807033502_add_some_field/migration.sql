/*
  Warnings:

  - You are about to drop the column `location_name` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `updatedTime` on the `Location` table. All the data in the column will be lost.
  - Added the required column `locationName` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Location" DROP COLUMN "location_name",
DROP COLUMN "updatedTime",
ADD COLUMN     "capacity" DOUBLE PRECISION,
ADD COLUMN     "isAssign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locationName" TEXT NOT NULL,
ADD COLUMN     "uploaddTime" TIMESTAMP(3);
