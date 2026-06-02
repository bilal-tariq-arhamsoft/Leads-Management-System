-- Sort and filter indexes
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt" DESC);
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_source_idx" ON "Lead"("source");
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt" DESC);

-- Fast ILIKE / contains search on text columns (pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Lead_firstName_trgm_idx" ON "Lead" USING gin ("firstName" gin_trgm_ops);
CREATE INDEX "Lead_lastName_trgm_idx" ON "Lead" USING gin ("lastName" gin_trgm_ops);
CREATE INDEX "Lead_email_trgm_idx" ON "Lead" USING gin ("email" gin_trgm_ops);
CREATE INDEX "Lead_phone_trgm_idx" ON "Lead" USING gin ("phone" gin_trgm_ops);
CREATE INDEX "Lead_company_trgm_idx" ON "Lead" USING gin ("company" gin_trgm_ops);
CREATE INDEX "Lead_position_trgm_idx" ON "Lead" USING gin ("position" gin_trgm_ops);
CREATE INDEX "Lead_assignedTo_trgm_idx" ON "Lead" USING gin ("assignedTo" gin_trgm_ops);
