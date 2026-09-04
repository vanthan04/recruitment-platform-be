/*
  Warnings:

  - You are about to drop the column `applicationMethod` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `workingHours` on the `jobs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "applicationMethod",
DROP COLUMN "workingHours",
ADD COLUMN     "extraInfo" JSONB;
