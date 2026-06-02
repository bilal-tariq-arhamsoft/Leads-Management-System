import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { ensureDefaultAdminUser } from "../src/lib/ensure-default-admin";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await ensureDefaultAdminUser();

  const email = (
    process.env.ADMIN_EMAIL ?? "admin@leadmanager.com"
  ).toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, position: true },
  });

  console.log(`Admin user in database: ${user?.email} (id: ${user?.id})`);
  console.log(`Login at /login with email: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
