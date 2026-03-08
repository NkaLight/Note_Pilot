import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

async function globalSetup() {
  console.log('🚀 Global setup: preparing test database...');
  
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST is not defined');

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });

  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS test CASCADE;`);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA test;`);
  await prisma.$disconnect();

  execSync('npx prisma db push --accept-data-loss', {
    env: { 
      ...process.env, 
      DATABASE_URL: url, 
      DIRECT_URL: process.env.DIRECT_URL_TEST 
    },
    stdio: 'inherit',
  });

  console.log('✅ Test database ready.');
}

export default globalSetup;