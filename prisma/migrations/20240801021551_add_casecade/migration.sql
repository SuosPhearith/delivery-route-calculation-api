-- DropForeignKey
ALTER TABLE "Direction" DROP CONSTRAINT "Direction_groupDirectionId_fkey";

-- AddForeignKey
ALTER TABLE "Direction" ADD CONSTRAINT "Direction_groupDirectionId_fkey" FOREIGN KEY ("groupDirectionId") REFERENCES "GroupDirection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
