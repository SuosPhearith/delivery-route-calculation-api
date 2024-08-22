/*
  Warnings:

  - The `flag` column on the `Location` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Flag" AS ENUM ('INF', 'CAP', 'DEL');

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "flag",
ADD COLUMN     "flag" "Flag";
