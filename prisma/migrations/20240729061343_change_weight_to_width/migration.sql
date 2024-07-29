/*
  Warnings:

  - You are about to drop the column `caseWeight` on the `CaseSize` table. All the data in the column will be lost.
  - You are about to drop the column `containerWeight` on the `TruckSize` table. All the data in the column will be lost.
  - Added the required column `caseWidth` to the `CaseSize` table without a default value. This is not possible if the table is not empty.
  - Added the required column `containerWidth` to the `TruckSize` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CaseSize" DROP COLUMN "caseWeight",
ADD COLUMN     "caseWidth" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "TruckSize" DROP COLUMN "containerWeight",
ADD COLUMN     "containerWidth" DOUBLE PRECISION NOT NULL;
