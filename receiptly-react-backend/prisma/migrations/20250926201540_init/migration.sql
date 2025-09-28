-- CreateTable
CREATE TABLE "public"."receipts" (
    "id" TEXT NOT NULL,
    "totalprice" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."items" ADD CONSTRAINT "items_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "public"."receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
