-- DropIndex
DROP INDEX "users_roleId_idx";

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "applicationMethod" TEXT,
ADD COLUMN     "workingHours" TEXT;
