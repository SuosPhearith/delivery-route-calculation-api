/*
  Warnings:

  - The values [assisant] on the enum `KeycloakAccountRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "KeycloakAccountRole_new" AS ENUM ('admin', 'manager', 'driver', 'assistant');
ALTER TABLE "KeycloakAccount" ALTER COLUMN "Role" TYPE "KeycloakAccountRole_new" USING ("Role"::text::"KeycloakAccountRole_new");
ALTER TYPE "KeycloakAccountRole" RENAME TO "KeycloakAccountRole_old";
ALTER TYPE "KeycloakAccountRole_new" RENAME TO "KeycloakAccountRole";
DROP TYPE "KeycloakAccountRole_old";
COMMIT;
