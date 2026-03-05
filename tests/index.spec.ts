import { test, expect } from '@playwright/test';

test.describe('Authentication Redirects', () => {
  test('should redirect authenticated users to the dashboard', async ({ page}) => {
    // 2. Navigate to the landing page
    // Playwright follows the 307 redirect automatically
    await page.goto('/');

    // 3. Assert the final URL
    await expect(page).toHaveURL(/\/dashboard/);
    
    // 4. Assert dashboard-specific content is visible
    await expect(page).toHaveTitle(/Dashboard/);
  });

  test('should show landing page to unauthenticated users', async ({ page, context }) => {
    // Ensure cookies are clear
    await context.clearCookies();

    await page.goto('/');

    // Assert we stayed on the landing page
    await expect(page).toHaveURL('/');
    
    // 4. Verify we are NOT redirected
    await expect(page).toHaveURL('/');
  });
    test('should redirect to home if the session cookie is invalid/fake', async ({ page, context }) => {
    // 1. Inject a "Garbage" cookie that looks real but isn't in your DB
    await context.addCookies([{
      name: 'session_token',
      value: 'this_is_a_fake_token_12345',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }]);

    // 2. Try to hit the dashboard
    await page.goto('/dashboard');

    // 3. Assertion: Your server-side check (user === null) should kick them out
    await expect(page).toHaveURL('/');
  });
});
