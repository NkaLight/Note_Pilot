import { test, expect, } from '@playwright/test';

test.describe('Authentication Redirects', () => {
  test('should not redirect authenticated users', async ({ page}) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).toHaveTitle(/Dashboard/);
  });

  test('should redirect guests to landing page', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });
    test('should redirect to home if the session cookie is invalid/fake', async ({ page, context }) => {
    await context.addCookies([{
      name: 'session_token',
      value: 'this_is_a_fake_token_12345',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }]);
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });
});

test('CREATE: should add a new paper via UI', async ({ page }) => {
  const newTitle = `New-Paper-${Date.now()}`;
  const uniqueId = Math.random().toString(36).substring(7);
  const paper_code = `COSC100-${uniqueId}`;
  await page.goto('/dashboard');
  
  await page.getByText("Add paper +").click();
  await page.getByPlaceholder("Paper Title").fill(newTitle);
  await page.getByPlaceholder("Paper Code").fill(paper_code);
  await page.getByPlaceholder("Paper Description").fill("descr");
  await page.click('button[type="submit"]');

  // Verification: The UI reflects the new row
  await expect(page.getByText(paper_code)).toBeVisible();
});

test('READ: should display list of papers', async ({ page, request }) => {
  const title = `List-Item-${Date.now()}`;
  const uniqueId = Math.random().toString(36).substring(7);
  const paper_code = `COSC102-${uniqueId}`;
  await request.post('/api/papers', { data: { name:title, code: paper_code, descr: "descr" }});
  await page.goto('/dashboard');
  await expect(page.getByText(paper_code)).toBeVisible();
});

test('UPDATE: should edit paper title via modal', async ({ page, request }) => {
  const originalTitle = `Edit-Me-${Date.now()}`;
  const uniqueId = Math.random().toString(36).substring(7);
  const paper_code = `COSC102-${uniqueId}`;
  const updatedCode = `NEW103-${uniqueId}`;
  
  // Create via API
  await request.post('/api/papers', { data: { name:originalTitle, code: paper_code, descr: "descr" }});

  await page.goto('/dashboard');
  await page.getByTestId(paper_code).click(); // Open Modal
  await page.getByPlaceholder("Paper Code").fill(updatedCode);
 await page.getByText("Update").click();

  await expect(page.getByText(updatedCode)).toBeVisible();
});
test('DELETE: should remove paper from dashboard', async ({ page, request }) => {
  const targetTitle = `Delete-Me-${Date.now()}`;
  const uniqueId = Math.random().toString(36).substring(7);
  const targetCode = `COSC104-${uniqueId}`;
  const result = await request.post('/api/papers', { data: { name:targetTitle, code: targetCode, descr: "descr" }});
  
  await page.goto('/dashboard');
  // Click delete button for this specific paper
  await page.getByTestId(targetCode).click();
  await page.getByText("Delete").click();

  await expect(page.getByText(targetCode)).not.toBeVisible();
});