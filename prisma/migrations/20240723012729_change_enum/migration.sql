/*
  Warnings:

  - The values [active,pending,inactive] on the enum `AccountStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [admin,manager,driver,assistant] on the enum `KeycloakAccountRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccountStatus_new" AS ENUM ('ACTIVE', 'PENDING', 'INACTIVE');
ALTER TABLE "KeycloakAccount" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "KeycloakAccount" ALTER COLUMN "status" TYPE "AccountStatus_new" USING ("status"::text::"AccountStatus_new");
ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
ALTER TYPE "AccountStatus_new" RENAME TO "AccountStatus";
DROP TYPE "AccountStatus_old";
ALTER TABLE "KeycloakAccount" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "KeycloakAccountRole_new" AS ENUM ('ADMIN', 'MANAGER', 'DRIVER', 'ASSISTANT');
ALTER TABLE "KeycloakAccount" ALTER COLUMN "Role" TYPE "KeycloakAccountRole_new" USING ("Role"::text::"KeycloakAccountRole_new");
ALTER TYPE "KeycloakAccountRole" RENAME TO "KeycloakAccountRole_old";
ALTER TYPE "KeycloakAccountRole_new" RENAME TO "KeycloakAccountRole";
DROP TYPE "KeycloakAccountRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "KeycloakAccount" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
