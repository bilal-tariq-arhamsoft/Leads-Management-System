-- Add FK column for manager assignment
ALTER TABLE "Lead" ADD COLUMN "assignedUserId" TEXT;

-- Map legacy assignedTo names to manager user ids (one lead per manager)
WITH matched AS (
  SELECT
    l."id" AS lead_id,
    u."id" AS user_id,
    ROW_NUMBER() OVER (PARTITION BY u."id" ORDER BY l."createdAt" ASC) AS rn
  FROM "Lead" l
  INNER JOIN "user" u
    ON LOWER(TRIM(l."assignedTo")) = LOWER(TRIM(u."name"))
    AND u."position" = 'MANAGER'
  WHERE l."assignedTo" IS NOT NULL AND TRIM(l."assignedTo") <> ''
)
UPDATE "Lead" l
SET "assignedUserId" = m.user_id
FROM matched m
WHERE l."id" = m.lead_id AND m.rn = 1;

DROP INDEX IF EXISTS "Lead_assignedTo_trgm_idx";

ALTER TABLE "Lead" DROP COLUMN "assignedTo";

CREATE UNIQUE INDEX "Lead_assignedUserId_key" ON "Lead"("assignedUserId");

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_assignedUserId_fkey"
  FOREIGN KEY ("assignedUserId") REFERENCES "user"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
