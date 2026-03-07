import { test, expect } from '@playwright/test';
import { createIsolatedUser, cleanupUser } from './helpers/create-test-user';

let userId: number;

test.beforeEach(async ({ context }) => {
  const { user } = await createIsolatedUser(context);
  userId = user.user_id;
  console.error("DASHBAORD user: ",  userId);
});

test.afterEach(async () => {
  await cleanupUser(userId);
});

test.describe('Dashboard auth guards', () => {
  test('should allow authenticated users to stay on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).toHaveTitle(/Dashboard/);
  });

  // Note: unauthenticated/fake cookie tests live in index.spec.ts
  // since they don't need the beforeEach auth setup
});

test('CREATE: should add a new paper via UI', async ({ page }) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const paper_code = `COSC100-${uniqueId}`;

  await page.goto('/dashboard');
  await page.getByText('Add paper +').click();
  await page.getByPlaceholder('Paper Title').fill(`New-Paper-${uniqueId}`);
  await page.getByPlaceholder('Paper Code').fill(paper_code);
  await page.getByPlaceholder('Paper Description').fill('descr');
  await page.click('button[type="submit"]');
  await expect(page.getByText(paper_code)).toBeVisible();
});

test('READ: should display list of papers', async ({ page }) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const paper_code = `COSC${uniqueId}`;

  await page.request.post('/api/papers', { 
    data: { name: `List-Item-${uniqueId}`, descr: 'descr', code: paper_code,  } 
  });

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(paper_code)).toBeVisible();
});

test('UPDATE: should edit paper code via modal', async ({ page }) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const paper_code = `COSC${uniqueId}`;
  const updatedCode = `NEW${uniqueId}`;

  await page.request.post('/api/papers', { 
    data: { name: `Edit-Me-${uniqueId}`, code: paper_code, descr: 'descr' } 
  });

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');// Wait for useEffect refresh to be complete
  await page.getByTestId(paper_code).scrollIntoViewIfNeeded();
  await page.getByTestId(paper_code).click();

  await expect(page.getByPlaceholder('Paper Code')).toBeVisible();
  await page.getByPlaceholder('Paper Code').fill(updatedCode);
  await page.getByText('Update').click();

  await expect(page.getByText(updatedCode)).toBeVisible();
});

test('DELETE: should remove paper from dashboard', async ({ page }) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const targetCode = `COSC104-${uniqueId}`;

  await page.request.post('/api/papers', { 
    data: { name: `Delete-Me-${uniqueId}`, code: targetCode, descr: 'descr' } 
  });
  await page.goto('/dashboard');
  await expect(page.getByText('Your Papers')).toBeVisible();

  await page.getByTestId(targetCode).scrollIntoViewIfNeeded();
  await page.getByTestId(targetCode).click();

  await expect(page.getByPlaceholder('Paper Code')).toBeVisible();
  await page.getByText('Delete').click();

  await expect(page.getByPlaceholder('Paper Code')).not.toBeVisible();
  await expect(page.getByText(targetCode)).not.toBeVisible();
});