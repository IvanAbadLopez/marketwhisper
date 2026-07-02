import pg from "pg";
import bcrypt from "bcrypt";

// Check if we're using local Docker DB (no SSL) or cloud DB (requires SSL)
const isLocalDB = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL!,
  ssl: isLocalDB ? false : { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const demoEmail = "demo@marketwhisper.com";

  const existing = await client.query(
    'SELECT id FROM "User" WHERE email = $1',
    [demoEmail]
  );

  if (existing.rows.length > 0) {
    console.log("Demo user already exists, skipping...");
    return;
  }

  const hashedPassword = await bcrypt.hash("MarketWhisper2026!", 12);
  const id = `cm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  await client.query(
    'INSERT INTO "User" (id, email, name, password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
    [id, demoEmail, "Demo User", hashedPassword]
  );

  console.log(`Demo user created: ${demoEmail} (ID: ${id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
