/*
  Warnings:

  - Added the required column `amount` to the `Requirement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Requirement" ADD COLUMN     "amount" INTEGER NOT NULL;
