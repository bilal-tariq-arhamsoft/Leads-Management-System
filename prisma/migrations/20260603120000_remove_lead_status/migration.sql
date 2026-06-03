-- DropIndex
DROP INDEX IF EXISTS "Lead_status_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "Lead_status_idx";

-- DropIndex
DROP INDEX IF EXISTS "lead_form_status_idx";

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "lead_form" DROP COLUMN "status";

-- DropEnum
DROP TYPE "LeadStatus";
