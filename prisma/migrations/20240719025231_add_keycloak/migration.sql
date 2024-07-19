/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `CaseSize` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Fuel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `TruckSize` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "KeycloakAccountRole" AS ENUM ('admin', 'manager', 'driver', 'assisant');

-- AlterTable
ALTER TABLE "Fuel" ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "KeycloakAccount" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "Role" "KeycloakAccountRole" NOT NULL,

    CONSTRAINT "KeycloakAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KeycloakAccount_email_key" ON "KeycloakAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "KeycloakAccount_username_key" ON "KeycloakAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "CaseSize_name_key" ON "CaseSize"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Fuel_name_key" ON "Fuel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TruckSize_name_key" ON "TruckSize"("name");
