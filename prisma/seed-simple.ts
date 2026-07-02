import { prisma } from "../src/lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  const demoEmail = "demo@marketwhisper.com";

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existing) {
    console.log("Demo user already exists, skipping...");
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

  console.log(`Demo user created: ${user.email} (ID: ${user.id})`);
}

main()
  .catch((e) => {
    console.error("Error creating demo user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
