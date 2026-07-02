import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'demo@marketwhisper.com' },
    });

    console.log('User found:', user);

    if (user && user.password) {
      const passwordMatch = await bcrypt.compare('demo1234', user.password);
      console.log('Password match:', passwordMatch);
      
      // Also try the other password from memory
      const passwordMatch2 = await bcrypt.compare('MarketWhisper2026!', user.password);
      console.log('Password match (MarketWhisper2026!):', passwordMatch2);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
