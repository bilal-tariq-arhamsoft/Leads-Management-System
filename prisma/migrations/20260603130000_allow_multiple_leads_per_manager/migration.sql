-- DropIndex
DROP INDEX IF EXISTS "Lead_assignedUserId_key";

-- CreateIndex
CREATE INDEX "Lead_assignedUserId_idx" ON "Lead"("assignedUserId");
