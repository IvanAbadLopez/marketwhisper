const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const demoEmail = "demo@marketwhisper.com";

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existing) {
    console.log("Demo user already exists!");
    return;
  }

  // Create demo user
  const hashedPassword = await bcrypt.hash("MarketWhisper2026!", 12);
  
  const user = await prisma.user.create({
    data: {
      email: demoEmail,
      name: "Demo User",
      password: hashedPassword,
    },
  });

  console.log(`✅ Demo user created: ${user.email}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
