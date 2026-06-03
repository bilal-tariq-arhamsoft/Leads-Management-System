-- Safeguard: allow the same manager on multiple leads (idempotent).
DROP INDEX IF EXISTS "Lead_assignedUserId_key";

CREATE INDEX IF NOT EXISTS "Lead_assignedUserId_idx" ON "Lead"("assignedUserId");
