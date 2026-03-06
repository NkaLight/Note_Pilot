import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const LoginUser = {
      userName:"testUser",
      email:"test@test.com",
      password:"testPassword123"
};
  
async function globalSetup() {
  console.log('🚀 GLOBAL SETUP STARTING: Preparing Database...');
  const url = process.env.DATABASE_URL_TEST;

  console.log('🏗️  Resetting test schema structure...');
  const adminPrisma = new PrismaClient({
    datasources: { db: { url: url } },
  });

  console.log('🗑️  Purging existing test schema...');
  await adminPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS test CASCADE;`);
  await adminPrisma.$executeRawUnsafe(`CREATE SCHEMA test;`);
  await adminPrisma.$disconnect();
  // Use execSync to run your prisma commands
  // This ensures the DB is ready before any project starts
  try {
    // You can also run a custom script here that drops the schema
    execSync('npx prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: process.env.DIRECT_URL_TEST}
    });
    console.log('✅ Database Schema Synced.');

    const testPrisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL_TEST } },
    });
    // 2. Seed the test user
    const hashedPassword = await bcrypt.hash(LoginUser.password, 10);
    const newUser = await testPrisma.application_user.create({
        data: {
            username: LoginUser.userName,
            email: LoginUser.email,
            password: hashedPassword // Store hashed password
        },
    });
    console.log('👤 Test user ', newUser.username , ' created in schema.');
    await testPrisma.$disconnect();
    await adminPrisma.$disconnect();
  } catch (error) {
    console.error('❌ Global Setup Failed:', error);
    throw error;
  }
}

export default globalSetup;