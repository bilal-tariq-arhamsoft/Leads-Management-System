-- DropIndex
DROP INDEX "Lead_assignedTo_trgm_idx";

-- DropIndex
DROP INDEX "Lead_company_trgm_idx";

-- DropIndex
DROP INDEX "Lead_email_trgm_idx";

-- DropIndex
DROP INDEX "Lead_firstName_trgm_idx";

-- DropIndex
DROP INDEX "Lead_lastName_trgm_idx";

-- DropIndex
DROP INDEX "Lead_phone_trgm_idx";

-- DropIndex
DROP INDEX "Lead_position_trgm_idx";

-- CreateTable
CREATE TABLE "lead_form" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_form_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_form_createdAt_idx" ON "lead_form"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "lead_form_email_idx" ON "lead_form"("email");

-- CreateIndex
CREATE INDEX "lead_form_status_idx" ON "lead_form"("status");

-- CreateIndex
CREATE INDEX "lead_form_source_idx" ON "lead_form"("source");
