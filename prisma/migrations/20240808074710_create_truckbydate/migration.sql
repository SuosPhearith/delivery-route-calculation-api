-- CreateTable
CREATE TABLE "TruckByDate" (
    "id" SERIAL NOT NULL,
    "capacity" DOUBLE PRECISION,
    "endTime" TIMESTAMP(3),
    "status" "TruckStatus" NOT NULL DEFAULT 'AVAILABLE',
    "truckId" INTEGER NOT NULL,

    CONSTRAINT "TruckByDate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TruckByDate" ADD CONSTRAINT "TruckByDate_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
