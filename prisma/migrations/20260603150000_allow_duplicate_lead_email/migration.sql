-- Allow multiple leads (and form approvals) with the same email.
DROP INDEX IF EXISTS "Lead_email_key";

CREATE INDEX IF NOT EXISTS "Lead_email_idx" ON "Lead"("email");
