/*
  Warnings:

  - You are about to drop the column `currency` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `totalprice` on the `receipts` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `receipts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `receipts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `receipts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."items" DROP COLUMN "currency",
ADD COLUMN     "quantity" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."receipts" DROP COLUMN "currency",
DROP COLUMN "totalprice",
ADD COLUMN     "subtotal" TEXT NOT NULL,
ADD COLUMN     "time" TEXT NOT NULL,
ADD COLUMN     "total" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."taxes" (
    "id" TEXT NOT NULL,
    "rate" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "change" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_receiptId_key" ON "public"."payments"("receiptId");

-- AddForeignKey
ALTER TABLE "public"."taxes" ADD CONSTRAINT "taxes_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "public"."receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "public"."receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
