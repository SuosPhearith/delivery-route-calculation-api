-- DropForeignKey
ALTER TABLE "Requirement" DROP CONSTRAINT "Requirement_caseSizeId_fkey";

-- DropForeignKey
ALTER TABLE "Requirement" DROP CONSTRAINT "Requirement_locationId_fkey";

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_caseSizeId_fkey" FOREIGN KEY ("caseSizeId") REFERENCES "CaseSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;
