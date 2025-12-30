-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "financingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "initialPayment" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "installments" INTEGER NOT NULL DEFAULT 1;
