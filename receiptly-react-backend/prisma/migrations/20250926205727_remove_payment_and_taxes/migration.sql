/*
  Warnings:

  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `taxes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_receiptId_fkey";

-- DropForeignKey
ALTER TABLE "public"."taxes" DROP CONSTRAINT "taxes_receiptId_fkey";

-- DropTable
DROP TABLE "public"."payments";

-- DropTable
DROP TABLE "public"."taxes";
