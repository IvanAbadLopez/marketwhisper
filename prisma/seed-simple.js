/**
 * Prisma Seed Script - Demo User
 * Creates demo@marketwhisper.com user if it doesn't exist
 * Idempotent (safe to run multiple times)
 * 
 * Usage:
 *   node prisma/seed-simple.js
 *   npm run db:seed
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require('bcrypt');

// Dynamic import to load ES module
async function main() {
  console.log('🌱 Seeding database with demo user...');

  // Import PrismaClient dynamically
  const { PrismaClient } = await import('../src/generated/prisma/client.js');
  const prisma = new PrismaClient();

  try {
    const demoEmail = 'demo@marketwhisper.com';
    const demoPassword = 'MarketWhisper2026!';
    
    // Hash password (bcrypt cost 12)
    const hashedPassword = await bcrypt.hash(demoPassword, 12);

    // Upsert demo user (idempotent - won't fail if already exists)
    const user = await prisma.user.upsert({
      where: { email: demoEmail },
      update: {}, // Don't update anything if user exists
      create: {
        email: demoEmail,
        name: 'Demo User',
        password: hashedPassword,
        emailVerified: new Date(), // Mark as verified
      },
    });

    console.log(`✅ Demo user ready: ${user.email} (ID: ${user.id})`);
    console.log(`   Password: ${demoPassword}`);
    console.log('🎉 Database seeded successfully!');
  } catch (e) {
    console.error('❌ Error seeding database:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(() => {
    process.exit(1);
  });
