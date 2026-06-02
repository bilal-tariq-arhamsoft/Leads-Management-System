-- Move existing Admin accounts into the unified user table
INSERT INTO "user" ("id", "name", "email", "passwordHash", "position", "createdAt", "updatedAt")
SELECT
  a."id",
  COALESCE(NULLIF(TRIM(a."name"), ''), 'Admin'),
  a."email",
  a."passwordHash",
  'ADMIN'::"UserPosition",
  a."createdAt",
  a."updatedAt"
FROM "Admin" a
ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "name" = EXCLUDED."name",
  "position" = 'ADMIN'::"UserPosition",
  "updatedAt" = EXCLUDED."updatedAt";

-- DropTable
DROP TABLE "Admin";
