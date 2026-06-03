import { PrismaClient, LeadSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SOURCES = Object.values(LeadSource);
const TOTAL_COUNT = 1_000_000;
const BATCH_SIZE = 5_000;
const POOL_SIZE = 200;

function maybe<T>(value: T, probability = 0.7): T | null {
  return Math.random() < probability ? value : null;
}

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function randomPastDate(years = 1): Date {
  const now = Date.now();
  const span = years * 365 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.floor(Math.random() * span));
}

function buildPools() {
  faker.seed(42);
  return {
    firstNames: Array.from({ length: POOL_SIZE }, () => faker.person.firstName()),
    lastNames: Array.from({ length: POOL_SIZE }, () => faker.person.lastName()),
    companies: Array.from({ length: POOL_SIZE }, () => faker.company.name()),
    positions: Array.from({ length: POOL_SIZE }, () => faker.person.jobTitle()),
    phones: Array.from({ length: POOL_SIZE }, () =>
      faker.phone.number({ style: "international" }),
    ),
    messages: Array.from({ length: POOL_SIZE }, () =>
      faker.lorem.paragraph({ min: 1, max: 2 }),
    ),
  };
}

function buildBatch(
  pools: ReturnType<typeof buildPools>,
  startIndex: number,
  size: number,
) {
  return Array.from({ length: size }, (_, i) => {
    const globalIndex = startIndex + i;
    const firstName = pick(pools.firstNames, globalIndex);
    const lastName = maybe(pick(pools.lastNames, globalIndex + 7), 0.9);
    const company = maybe(pick(pools.companies, globalIndex + 13), 0.75);

    return {
      firstName,
      lastName,
      email: `lead.${globalIndex + 1}@example.test`,
      phone: maybe(pick(pools.phones, globalIndex + 3), 0.85),
      company,
      position: company ? maybe(pick(pools.positions, globalIndex + 11), 0.8) : null,
      source: maybe(pick(SOURCES, globalIndex + 5), 0.9),
      message: maybe(pick(pools.messages, globalIndex + 17), 0.4),
      isActive: Math.random() < 0.92,
      createdAt: randomPastDate(1),
    };
  });
}

async function seedAdminUser() {
  const { ensureDefaultAdminUser } = await import(
    "../src/lib/ensure-default-admin"
  );
  await ensureDefaultAdminUser();
  const email = (process.env.ADMIN_EMAIL ?? "admin@leadmanager.com").toLowerCase();
  console.log(`Admin user ready: ${email} — login at /login`);
}

async function main() {
  await seedAdminUser();

  const pools = buildPools();
  let inserted = 0;
  const startedAt = Date.now();

  console.log(`Seeding ${TOTAL_COUNT.toLocaleString()} leads in batches of ${BATCH_SIZE}...`);

  for (let offset = 0; offset < TOTAL_COUNT; offset += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, TOTAL_COUNT - offset);
    const leads = buildBatch(pools, offset, size);

    const result = await prisma.lead.createMany({
      data: leads,
      skipDuplicates: true,
    });

    inserted += result.count;

    const done = offset + size;
    const pct = ((done / TOTAL_COUNT) * 100).toFixed(1);
    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(0);
    console.log(
      `  ${done.toLocaleString()} / ${TOTAL_COUNT.toLocaleString()} (${pct}%) — batch inserted ${result.count}, total ${inserted.toLocaleString()}, ${elapsedSec}s`,
    );
  }

  const totalSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `Done. Inserted ${inserted.toLocaleString()} leads (${TOTAL_COUNT.toLocaleString()} requested) in ${totalSec}s.`,
  );
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
