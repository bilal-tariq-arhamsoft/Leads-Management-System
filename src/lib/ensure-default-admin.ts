import { UserPosition } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { hashPassword } from "@/lib/auth-password";

const DEFAULT_EMAIL = "admin@leadmanager.com";
const DEFAULT_PASSWORD = "admin123";
const DEFAULT_NAME = "System Admin";

let ensurePromise: Promise<void> | null = null;

/**
 * Ensures the default administrator exists in the `user` table.
 * Email and password are hashed before storage (never stored in plain text).
 */
export async function ensureDefaultAdminUser(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      const email = (
        process.env.ADMIN_EMAIL ?? DEFAULT_EMAIL
      ).toLowerCase();
      const password = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
      const name = process.env.ADMIN_NAME ?? DEFAULT_NAME;
      const passwordHash = await hashPassword(password);

      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name,
          passwordHash,
          position: UserPosition.ADMIN,
        },
        update: {
          name,
          passwordHash,
          position: UserPosition.ADMIN,
        },
      });
    })().catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }
  await ensurePromise;
}
