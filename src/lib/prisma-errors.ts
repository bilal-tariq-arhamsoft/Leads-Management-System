/** Human-readable message for Prisma unique constraint (P2002) failures. */
export function uniqueConstraintMessage(error: unknown): string | null {
  const err = error as { code?: string; message?: string; meta?: { target?: unknown } };
  if (err.code !== "P2002") return null;

  const haystack = [err.message, JSON.stringify(err.meta?.target ?? "")]
    .join(" ")
    .toLowerCase();

  if (haystack.includes("email") && haystack.includes("user")) {
    return "A user with this email already exists";
  }
  if (haystack.includes("assigneduserid")) {
    return "This manager cannot be assigned to another lead yet. Run npx prisma migrate deploy, then restart the dev server.";
  }
  return null;
}
