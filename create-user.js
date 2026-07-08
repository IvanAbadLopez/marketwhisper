const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  console.log('Creating demo user...');
  
  const hashedPassword = await bcrypt.hash('MarketWhisper2026!', 12);
  console.log('Password hashed');
  
  const user = await prisma.user.create({
    data: {
      email: 'demo@marketwhisper.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  console.log('✅ User created:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
