import { test, expect } from '@playwright/test';

test.describe('Authentication Redirects', () => {

  test('should redirect authenticated users to the dashboard', async ({ page, context }) => {
    // 1. Setup the session cookie
    await context.addCookies([
      {
        name: 'session_token',
        value: 'some-dummy-jwt-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // 2. Navigate to the landing page
    // Playwright follows the 307 redirect automatically
    await page.goto('/');

    // 3. Assert the final URL
    await expect(page).toHaveURL(/\/dashboard/);
    
    // 4. Assert dashboard-specific content is visible
    await expect(page).toHaveTitle(/Dashboard/);
    await expect(page.getByText("Add paper +")).toBeVisible();

  });

  test('should show landing page to unauthenticated users', async ({ page, context }) => {
    // Ensure cookies are clear
    await context.clearCookies();

    await page.goto('/');

    // Assert we stayed on the landing page
    await expect(page).toHaveURL('/');
        // 3. Assert landing page content is visible
    await expect(page.getByText('Study smarter, not harder.')).toBeVisible();
    await expect(page.getByText('Flashcards in Minutes')).toBeVisible();
    
    // 4. Verify we are NOT redirected
    await expect(page).toHaveURL('/');
  });
});
