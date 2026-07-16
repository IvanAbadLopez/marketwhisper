/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const demoEmail = 'demo@marketwhisper.com';
  const hashedPassword = await bcrypt.hash('MarketWhisper2026!', 12);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  console.log(`✅ Demo user: ${user.email}`);

  // Create sample companies
  const companies = [
    {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      description: 'Technology company that designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCap: 2800000000000,
      website: 'https://www.apple.com',
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      description: 'Technology company that develops, licenses, and supports software, services, devices, and solutions.',
      sector: 'Technology',
      industry: 'Software',
      marketCap: 2400000000000,
      website: 'https://www.microsoft.com',
    },
    {
      ticker: 'GOOGL',
      name: 'Alphabet Inc.',
      description: 'Technology company specializing in Internet-related services and products.',
      sector: 'Technology',
      industry: 'Internet Content & Information',
      marketCap: 1700000000000,
      website: 'https://www.google.com',
    },
  ];

  for (const companyData of companies) {
    const company = await prisma.company.upsert({
      where: { ticker: companyData.ticker },
      update: {},
      create: companyData,
    });
    console.log(`✅ Company: ${company.ticker} - ${company.name}`);
  }

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
