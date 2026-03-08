import { test, expect } from '@playwright/test';
import { createIsolatedUser, cleanupUser } from '../../helpers/create-test-user';

test.describe('Landing page — authenticated', () => {
  let userId: number;

  test.beforeEach(async ({ context }) => {
    const { user } = await createIsolatedUser(context);
    userId = user.user_id;
    console.error("index page: ", userId);
  });

  test.afterEach(async () => {
    await cleanupUser(userId);
  });

  test('should redirect authenticated users to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).toHaveTitle(/Dashboard/);
  });
});

// These tests need no auth setup at all — no beforeEach needed
test.describe('Landing page — unauthenticated', () => {
  test('should show landing page to guests', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('should redirect to home with fake session cookie', async ({ page, context }) => {
    await context.addCookies([{
      name: 'session_token',
      value: 'fake_token_12345',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });
});