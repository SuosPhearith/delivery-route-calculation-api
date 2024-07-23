-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'pending', 'inactive');

-- AlterTable
ALTER TABLE "KeycloakAccount" ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'active';
