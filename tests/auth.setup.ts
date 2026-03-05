import { test as setup, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';


setup('database-and-auth-setup', async ({ page }) => {
  console.log('🏗️  Resetting test schema structure...');
  const adminPrisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_TEST } },
  });

  console.log('🗑️  Purging existing test schema...');
  await adminPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS test CASCADE;`);
  await adminPrisma.$executeRawUnsafe(`CREATE SCHEMA test;`);
  await adminPrisma.$disconnect();

  // 1. Sync the schema (Tables only, no data)
  console.log('🏗️  Rebuilding schema from Prisma models...');
  execSync('npx prisma db push --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST, DIRECT_URL: process.env.DIRECT_URL_TEST}
  });
  const testPrisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_TEST } },
  });

  // 2. Seed the test user
  const userName = "testUser";
  const email = 'test@test.com';
  const password = 'testPassword123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
    const user = await testPrisma.application_user.create({
        data: {
            username: userName,
            email: email,
            password: hashedPassword // Store hashed password
        },
    });
  console.log('👤 Test user ', user.username , ' created in schema.');

  // 3. Perform the actual Login UI flow
  await page.goto('/');
  await page.getByRole('button', { name: /login/i }).click();
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // If the redirect fails, check if your UI is displaying an error
  const errorCallout = page.locator('.text-red-900');
  if (await errorCallout.isVisible()) {
    const msg = await errorCallout.innerText();
    throw new Error(`Login failed with server error: ${msg}`);
  }
    
  // 4. Assert redirect to verify the session was written to the DB
  await expect(page).toHaveURL(/\/dashboard/);

  // 5. Save the 'session_token' cookie for all other tests
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  await testPrisma.$disconnect();
  console.log('✅ Auth state captured.');

});