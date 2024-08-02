-- CreateTable
CREATE TABLE "GroupDirection" (
    "id" SERIAL NOT NULL,
    "group" TEXT NOT NULL,
    "note" TEXT,
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

    CONSTRAINT "Direction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupDirection_group_key" ON "GroupDirection"("group");

-- AddForeignKey
ALTER TABLE "Direction" ADD CONSTRAINT "Direction_groupDirectionId_fkey" FOREIGN KEY ("groupDirectionId") REFERENCES "GroupDirection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
