-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `roleId` INTEGER NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `avatar` VARCHAR(191) NULL,
    `gender` ENUM('male', 'female') NULL,
    `session` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `device` VARCHAR(191) NOT NULL,
    `browser` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserSession_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LicenseType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assistant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `age` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Assistant_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Driver` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `age` INTEGER NULL,
    `licenseId` VARCHAR(191) NOT NULL,
    `licenseTypeId` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Driver_userId_key`(`userId`),
    UNIQUE INDEX `Driver_licenseId_key`(`licenseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KeycloakAccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'PENDING', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `Role` ENUM('ADMIN', 'MANAGER', 'DRIVER', 'ASSISTANT') NOT NULL,

    UNIQUE INDEX `KeycloakAccount_email_key`(`email`),
    UNIQUE INDEX `KeycloakAccount_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Fuel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Fuel_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TruckSize` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `containerLenght` DOUBLE NOT NULL,
    `containerWidth` DOUBLE NOT NULL,
    `containerHeight` DOUBLE NOT NULL,
    `containerCubic` DOUBLE NOT NULL,
    `default` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `TruckSize_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CaseSize` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `caseLenght` DOUBLE NOT NULL,
    `caseWidth` DOUBLE NOT NULL,
    `caseHeight` DOUBLE NOT NULL,
    `caseCubic` DOUBLE NOT NULL,

    UNIQUE INDEX `CaseSize_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Truck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `truckSizeId` INTEGER NULL,
    `fuelId` INTEGER NULL,
    `licensePlate` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NULL,
    `manufacturer` VARCHAR(191) NULL,
    `functioning` VARCHAR(191) NULL,
    `status` ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `zoneId` INTEGER NULL,
    `warehouseId` INTEGER NULL,
    `truckOwnershipTypeId` INTEGER NULL,

    UNIQUE INDEX `Truck_licensePlate_key`(`licensePlate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TruckAssistant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `truckId` INTEGER NOT NULL,
    `assistantId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TruckDriver` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `truckId` INTEGER NOT NULL,
    `driverId` INTEGER NOT NULL,
    `deliveryAmount` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `System` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `speed` DOUBLE NOT NULL DEFAULT 40,
    `dropOffDuration` INTEGER NOT NULL DEFAULT 2,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Zone` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `truckAmount` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `officerControllId` INTEGER NULL,

    UNIQUE INDEX `Zone_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfficerControll` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `OfficerControll_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Warehouse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `long` DOUBLE NOT NULL,
    `information` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Warehouse_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TruckOwnershipType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `TruckOwnershipType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupDirection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `file` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `GroupDirection_group_key`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Direction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `route` VARCHAR(191) NULL,
    `lat` DOUBLE NOT NULL,
    `long` DOUBLE NOT NULL,
    `name` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `groupDirectionId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryRouteCalculationDate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DeliveryRouteCalculationDate_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Location` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentType` VARCHAR(191) NULL,
    `documentNumber` VARCHAR(191) NULL,
    `documentDate` VARCHAR(191) NULL,
    `sla` VARCHAR(191) NULL,
    `uploaddTime` VARCHAR(191) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `locationName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `se` VARCHAR(191) NOT NULL,
    `homeNo` VARCHAR(191) NULL,
    `streetNo` VARCHAR(191) NULL,
    `village` VARCHAR(191) NULL,
    `sangkat` VARCHAR(191) NULL,
    `khan` VARCHAR(191) NULL,
    `hotSpot` VARCHAR(191) NULL,
    `direction` VARCHAR(191) NULL,
    `area` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `division` VARCHAR(191) NULL,
    `zoneId` INTEGER NULL,
    `truckSizeId` INTEGER NULL,
    `deliveryDate` VARCHAR(191) NULL,
    `paymentTerm` VARCHAR(191) NULL,
    `comments` VARCHAR(191) NULL,
    `flag` ENUM('INF', 'CAP', 'DEL') NULL,
    `code` VARCHAR(191) NULL,
    `isSplit` BOOLEAN NULL DEFAULT false,
    `priority` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'TRIVIAL') NOT NULL,
    `partOfDay` ENUM('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT') NOT NULL,
    `capacity` DOUBLE NULL,
    `isAssign` BOOLEAN NOT NULL DEFAULT false,
    `deliveryRouteCalculationDateId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Location_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Requirement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` INTEGER NOT NULL,
    `locationId` INTEGER NOT NULL,
    `caseSizeId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TruckByDate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `capacity` DOUBLE NULL,
    `endTime` DATETIME(3) NULL,
    `status` ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    `truckId` INTEGER NOT NULL,
    `deliveryRouteCalculationDateId` INTEGER NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssignLocationToTruck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `locationId` INTEGER NOT NULL,
    `truckByDateId` INTEGER NOT NULL,
    `deliveryRouteCalculationDateId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AssignLocationToTruck_locationId_deliveryRouteCalculationDat_key`(`locationId`, `deliveryRouteCalculationDateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutoAssign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deliveryRouteCalculationDateId` INTEGER NOT NULL,
    `zoneId` INTEGER NOT NULL,
    `truckSizeId` INTEGER NOT NULL,
    `partOfDay` ENUM('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT') NOT NULL,
    `priority` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'TRIVIAL') NOT NULL,
    `locationId` INTEGER NOT NULL,
    `isAssign` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutoTruck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deliveryRouteCalculationDateId` INTEGER NOT NULL,
    `truckOwnershipTypeId` INTEGER NOT NULL,
    `zoneId` INTEGER NOT NULL,
    `truckSizeId` INTEGER NOT NULL,
    `truckId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSession` ADD CONSTRAINT `UserSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assistant` ADD CONSTRAINT `Assistant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Driver` ADD CONSTRAINT `Driver_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Driver` ADD CONSTRAINT `Driver_licenseTypeId_fkey` FOREIGN KEY (`licenseTypeId`) REFERENCES `LicenseType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Truck` ADD CONSTRAINT `Truck_truckSizeId_fkey` FOREIGN KEY (`truckSizeId`) REFERENCES `TruckSize`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Truck` ADD CONSTRAINT `Truck_fuelId_fkey` FOREIGN KEY (`fuelId`) REFERENCES `Fuel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Truck` ADD CONSTRAINT `Truck_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Truck` ADD CONSTRAINT `Truck_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Truck` ADD CONSTRAINT `Truck_truckOwnershipTypeId_fkey` FOREIGN KEY (`truckOwnershipTypeId`) REFERENCES `TruckOwnershipType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TruckAssistant` ADD CONSTRAINT `TruckAssistant_truckId_fkey` FOREIGN KEY (`truckId`) REFERENCES `Truck`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TruckAssistant` ADD CONSTRAINT `TruckAssistant_assistantId_fkey` FOREIGN KEY (`assistantId`) REFERENCES `KeycloakAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TruckDriver` ADD CONSTRAINT `TruckDriver_truckId_fkey` FOREIGN KEY (`truckId`) REFERENCES `Truck`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TruckDriver` ADD CONSTRAINT `TruckDriver_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `KeycloakAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Zone` ADD CONSTRAINT `Zone_officerControllId_fkey` FOREIGN KEY (`officerControllId`) REFERENCES `OfficerControll`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Direction` ADD CONSTRAINT `Direction_groupDirectionId_fkey` FOREIGN KEY (`groupDirectionId`) REFERENCES `GroupDirection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Location` ADD CONSTRAINT `Location_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Location` ADD CONSTRAINT `Location_truckSizeId_fkey` FOREIGN KEY (`truckSizeId`) REFERENCES `TruckSize`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Location` ADD CONSTRAINT `Location_deliveryRouteCalculationDateId_fkey` FOREIGN KEY (`deliveryRouteCalculationDateId`) REFERENCES `DeliveryRouteCalculationDate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Requirement` ADD CONSTRAINT `Requirement_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Requirement` ADD CONSTRAINT `Requirement_caseSizeId_fkey` FOREIGN KEY (`caseSizeId`) REFERENCES `CaseSize`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TruckByDate` ADD CONSTRAINT `TruckByDate_truckId_fkey` FOREIGN KEY (`truckId`) REFERENCES `Truck`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TruckByDate` ADD CONSTRAINT `TruckByDate_deliveryRouteCalculationDateId_fkey` FOREIGN KEY (`deliveryRouteCalculationDateId`) REFERENCES `DeliveryRouteCalculationDate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssignLocationToTruck` ADD CONSTRAINT `AssignLocationToTruck_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssignLocationToTruck` ADD CONSTRAINT `AssignLocationToTruck_truckByDateId_fkey` FOREIGN KEY (`truckByDateId`) REFERENCES `TruckByDate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssignLocationToTruck` ADD CONSTRAINT `AssignLocationToTruck_deliveryRouteCalculationDateId_fkey` FOREIGN KEY (`deliveryRouteCalculationDateId`) REFERENCES `DeliveryRouteCalculationDate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoAssign` ADD CONSTRAINT `AutoAssign_deliveryRouteCalculationDateId_fkey` FOREIGN KEY (`deliveryRouteCalculationDateId`) REFERENCES `DeliveryRouteCalculationDate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoAssign` ADD CONSTRAINT `AutoAssign_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoAssign` ADD CONSTRAINT `AutoAssign_truckSizeId_fkey` FOREIGN KEY (`truckSizeId`) REFERENCES `TruckSize`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoAssign` ADD CONSTRAINT `AutoAssign_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoTruck` ADD CONSTRAINT `AutoTruck_deliveryRouteCalculationDateId_fkey` FOREIGN KEY (`deliveryRouteCalculationDateId`) REFERENCES `DeliveryRouteCalculationDate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoTruck` ADD CONSTRAINT `AutoTruck_truckOwnershipTypeId_fkey` FOREIGN KEY (`truckOwnershipTypeId`) REFERENCES `TruckOwnershipType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoTruck` ADD CONSTRAINT `AutoTruck_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoTruck` ADD CONSTRAINT `AutoTruck_truckSizeId_fkey` FOREIGN KEY (`truckSizeId`) REFERENCES `TruckSize`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoTruck` ADD CONSTRAINT `AutoTruck_truckId_fkey` FOREIGN KEY (`truckId`) REFERENCES `Truck`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
