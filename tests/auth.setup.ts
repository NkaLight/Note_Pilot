import { test as setup, expect } from '@playwright/test';
import { LoginUser } from './global-setup';

setup('database-and-auth-setup', async ({ page }) => {
  // 1.Perform the actual Login UI flow to retrieve the access_token
  await page.goto('/');
  await page.getByRole('button', { name: /login/i }).click();
  await page.fill('input[name="email"]', "test@test.com");
  await page.fill('input[name="password"]', "testPassword123");
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
  console.log('✅ Auth state captured.');

});