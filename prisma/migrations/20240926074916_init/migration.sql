-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "KeycloakAccountRole" AS ENUM ('ADMIN', 'MANAGER', 'DRIVER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PENDING', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TruckStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'TRIVIAL');

-- CreateEnum
CREATE TYPE "PartOfDay" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT');

-- CreateEnum
CREATE TYPE "Flag" AS ENUM ('INF', 'CAP', 'DEL');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "gender" "Gender",
    "session" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "LicenseType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assistant" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "age" INTEGER,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assistant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "age" INTEGER,
    "licenseId" TEXT NOT NULL,
    "licenseTypeId" INTEGER NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeycloakAccount" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "Role" "KeycloakAccountRole" NOT NULL,

    CONSTRAINT "KeycloakAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fuel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Fuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckSize" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "containerLenght" DOUBLE PRECISION NOT NULL,
    "containerWidth" DOUBLE PRECISION NOT NULL,
    "containerHeight" DOUBLE PRECISION NOT NULL,
    "containerCubic" DOUBLE PRECISION NOT NULL,
    "default" BOOLEAN DEFAULT false,

    CONSTRAINT "TruckSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseSize" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "caseLenght" DOUBLE PRECISION NOT NULL,
    "caseWidth" DOUBLE PRECISION NOT NULL,
    "caseHeight" DOUBLE PRECISION NOT NULL,
    "caseCubic" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CaseSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" SERIAL NOT NULL,
    "truckSizeId" INTEGER,
    "fuelId" INTEGER,
    "licensePlate" TEXT NOT NULL,
    "model" TEXT,
    "manufacturer" TEXT,
    "functioning" TEXT,
    "status" "TruckStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "zoneId" INTEGER,
    "warehouseId" INTEGER,
    "truckOwnershipTypeId" INTEGER,

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckAssistant" (
    "id" SERIAL NOT NULL,
    "truckId" INTEGER NOT NULL,
    "assistantId" INTEGER NOT NULL,

    CONSTRAINT "TruckAssistant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckDriver" (
    "id" SERIAL NOT NULL,
    "truckId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "deliveryAmount" INTEGER,

    CONSTRAINT "TruckDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "System" (
    "id" SERIAL NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "dropOffDuration" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "System_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "truckAmount" INTEGER,
    "description" TEXT,
    "officerControllId" INTEGER,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficerControll" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "OfficerControll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "information" TEXT NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckOwnershipType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "TruckOwnershipType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDirection" (
    "id" SERIAL NOT NULL,
    "group" TEXT NOT NULL,
    "note" TEXT,
    "file" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupDirection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Direction" (
    "id" SERIAL NOT NULL,
    "route" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "groupDirectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Direction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryRouteCalculationDate" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryRouteCalculationDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "documentDate" TEXT,
    "sla" TEXT,
    "uploaddTime" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" TEXT NOT NULL,
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
    "deliveryDate" TEXT,
    "paymentTerm" TEXT,
    "comments" TEXT,
    "flag" "Flag",
    "code" TEXT,
    "isSplit" BOOLEAN DEFAULT false,
    "priority" "Priority" NOT NULL,
    "partOfDay" "PartOfDay" NOT NULL,
    "capacity" DOUBLE PRECISION,
    "isAssign" BOOLEAN NOT NULL DEFAULT false,
    "deliveryRouteCalculationDateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "caseSizeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckByDate" (
    "id" SERIAL NOT NULL,
    "capacity" DOUBLE PRECISION,
    "endTime" TIMESTAMP(3),
    "status" "TruckStatus" NOT NULL DEFAULT 'AVAILABLE',
    "truckId" INTEGER NOT NULL,
    "deliveryRouteCalculationDateId" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TruckByDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignLocationToTruck" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "truckByDateId" INTEGER NOT NULL,
    "deliveryRouteCalculationDateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignLocationToTruck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoAssign" (
    "id" SERIAL NOT NULL,
    "deliveryRouteCalculationDateId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "truckSizeId" INTEGER NOT NULL,
    "partOfDay" "PartOfDay" NOT NULL,
    "priority" "Priority" NOT NULL,
    "locationId" INTEGER NOT NULL,
    "isAssign" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoAssign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoTruck" (
    "id" SERIAL NOT NULL,
    "deliveryRouteCalculationDateId" INTEGER NOT NULL,
    "truckOwnershipTypeId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "truckSizeId" INTEGER NOT NULL,
    "truckId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoTruck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "UserSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Assistant_userId_key" ON "Assistant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_licenseId_key" ON "Driver"("licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "KeycloakAccount_email_key" ON "KeycloakAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "KeycloakAccount_username_key" ON "KeycloakAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Fuel_name_key" ON "Fuel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TruckSize_name_key" ON "TruckSize"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CaseSize_name_key" ON "CaseSize"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_licensePlate_key" ON "Truck"("licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_code_key" ON "Zone"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OfficerControll_name_key" ON "OfficerControll"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_name_key" ON "Warehouse"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TruckOwnershipType_name_key" ON "TruckOwnershipType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GroupDirection_group_key" ON "GroupDirection"("group");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRouteCalculationDate_date_key" ON "DeliveryRouteCalculationDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AssignLocationToTruck_locationId_deliveryRouteCalculationDa_key" ON "AssignLocationToTruck"("locationId", "deliveryRouteCalculationDateId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_licenseTypeId_fkey" FOREIGN KEY ("licenseTypeId") REFERENCES "LicenseType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_truckSizeId_fkey" FOREIGN KEY ("truckSizeId") REFERENCES "TruckSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_fuelId_fkey" FOREIGN KEY ("fuelId") REFERENCES "Fuel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_truckOwnershipTypeId_fkey" FOREIGN KEY ("truckOwnershipTypeId") REFERENCES "TruckOwnershipType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckAssistant" ADD CONSTRAINT "TruckAssistant_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckAssistant" ADD CONSTRAINT "TruckAssistant_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "KeycloakAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckDriver" ADD CONSTRAINT "TruckDriver_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckDriver" ADD CONSTRAINT "TruckDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "KeycloakAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_officerControllId_fkey" FOREIGN KEY ("officerControllId") REFERENCES "OfficerControll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Direction" ADD CONSTRAINT "Direction_groupDirectionId_fkey" FOREIGN KEY ("groupDirectionId") REFERENCES "GroupDirection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_truckSizeId_fkey" FOREIGN KEY ("truckSizeId") REFERENCES "TruckSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_caseSizeId_fkey" FOREIGN KEY ("caseSizeId") REFERENCES "CaseSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckByDate" ADD CONSTRAINT "TruckByDate_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckByDate" ADD CONSTRAINT "TruckByDate_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignLocationToTruck" ADD CONSTRAINT "AssignLocationToTruck_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignLocationToTruck" ADD CONSTRAINT "AssignLocationToTruck_truckByDateId_fkey" FOREIGN KEY ("truckByDateId") REFERENCES "TruckByDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignLocationToTruck" ADD CONSTRAINT "AssignLocationToTruck_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAssign" ADD CONSTRAINT "AutoAssign_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAssign" ADD CONSTRAINT "AutoAssign_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAssign" ADD CONSTRAINT "AutoAssign_truckSizeId_fkey" FOREIGN KEY ("truckSizeId") REFERENCES "TruckSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAssign" ADD CONSTRAINT "AutoAssign_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoTruck" ADD CONSTRAINT "AutoTruck_deliveryRouteCalculationDateId_fkey" FOREIGN KEY ("deliveryRouteCalculationDateId") REFERENCES "DeliveryRouteCalculationDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoTruck" ADD CONSTRAINT "AutoTruck_truckOwnershipTypeId_fkey" FOREIGN KEY ("truckOwnershipTypeId") REFERENCES "TruckOwnershipType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoTruck" ADD CONSTRAINT "AutoTruck_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoTruck" ADD CONSTRAINT "AutoTruck_truckSizeId_fkey" FOREIGN KEY ("truckSizeId") REFERENCES "TruckSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoTruck" ADD CONSTRAINT "AutoTruck_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
