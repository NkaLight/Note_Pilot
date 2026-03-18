import {test as base, expect} from "@playwright/test";
import { createIsolatedUser, cleanupUser, createTestPasswordResetToken } from "../../helpers/create-test-user";


const test = base.extend<{
  testUser: { userId: number; email: string; password: string };
}>({
  testUser: async ({ context }, Use) => {
    const { user } = await createIsolatedUser(context);
    // Run the test with this user
    await Use({
      userId: user.user_id,
      email: user.email,
      password: user.password,
    });
    // Teardown after test completes
    await cleanupUser(user.user_id);
  },
});

test("Email exists - Forgot passwowrd", async ({browser, testUser })=>{
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();

    await page.goto('/');
    await page.getByText("Login").click();
    await page.getByText("Forgot Password").click();
    await page.getByPlaceholder("yourEmail@example.com").fill(testUser.email);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("You should get an email if you are signed up with us.")).toBeVisible();
    await freshContext.close();
});

test("Email does not exist - Forgot passwowrd", async ({browser})=>{
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();

    await page.goto('/');
    await page.getByText("Login").click();
    await page.getByText("Forgot Password").click();
    await page.getByPlaceholder("yourEmail@example.com").fill("nonExistentEmail@email.com");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("You should get an email if you are signed up with us.")).toBeVisible();
    await freshContext.close();
});

test("Email link valid", async ({browser, testUser })=>{
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();

    const newPassword = "newPasswordtest123";
    const rawToken = await createTestPasswordResetToken(testUser.email); 

    // Generate Magic Link Token (The "Email Ownership" Key)
    await page.goto(`/auth/reset_password?token=${rawToken}`);
    // Log how long verify takes
    const start = Date.now();
    await page.waitForLoadState("networkidle");
    console.error(`networkidle after: ${Date.now() - start}ms`);
    await page.getByPlaceholder("Password", {exact:true}).fill(newPassword);
    await page.getByPlaceholder("Confirm Password", {exact:true}).fill(newPassword);
    await page.getByRole("button", { name: "RESET" }).click();
    await page.waitForLoadState("networkidle"); 
    await expect(page.getByText("Password reset successfully")).toBeVisible();
    await freshContext.close();
});

test("Invalid token could be expired", async ({browser})=>{
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();

    const rawToken = "expiredToken"; 

    await page.goto(`/auth/reset_password?token=${rawToken}`);
    await expect(page.getByText("Link expired please click forgot password again")).toBeVisible();
    await freshContext.close();
});