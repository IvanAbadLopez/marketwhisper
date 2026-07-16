/**
 * Prisma Seed Script - Demo User
 * Creates demo@marketwhisper.com user if it doesn't exist
 * Idempotent (safe to run multiple times)
 * 
 * Usage:
 *   node prisma/seed.mjs
 *   npm run db:seed
 */

import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo user...');

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
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
