import {test, expect} from "@playwright/test";
import { createIsolatedUser, cleanupUser } from "../../helpers/create-test-user";
import { createPasswordResetToken } from "@/lib/services/reset_password";

let userId: number;
let email:string;
let password:string;

test.beforeEach(async ({ context }) => {
  const { user } = await createIsolatedUser(context);
  userId = user.user_id;
  email = user.email;
  password = user.password;
  console.error("DASHBAORD user: ",  userId);
});

test.afterEach(async () => {
  await cleanupUser(userId);
});

test("Clicks forgot password.", ()=>{
    test("Email exists - Forgot passwowrd", async ({browser})=>{
        const freshContext = await browser.newContext();
        const page = await freshContext.newPage();

        await page.goto('/');
        await page.getByText("Login").click();
        await page.getByText("Forgot Password").click();
        await page.getByPlaceholder("yourEmail@example.com").fill(email);
        await page.getByRole("button", { name: "Submit" }).click();
        await expect(page.getByText("You should get an email if the user exists")).toBeVisible();
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
});

test("Clicks email reset password", ()=>{
    test("Email link valid", async ({browser})=>{
        const freshContext = await browser.newContext();
        const page = await freshContext.newPage();

        const newPassword = "newPasswordtest123";
        const rawToken = await createPasswordResetToken(email); 

         // Generate Magic Link Token (The "Email Ownership" Key)
        await page.goto(`/reset_password?token=${rawToken}`);
        await page.getByPlaceholder("password").fill(newPassword);
        await page.getByPlaceholder("confirm password");
        await page.getByText("Reset").click();

        await expect(page.getByText("Password reset successfully")).toBeVisible();
        await freshContext.close();
    });

    test("Invalid token could be expired", async ({browser})=>{
        const freshContext = await browser.newContext();
        const page = await freshContext.newPage();

        const rawToken = "expiredToken"; 

        await page.goto(`/reset_password?token=${rawToken}`);
        expect(page.getByText("Link expired please click forgot password again")).toBeVisible();
         await freshContext.close();
    });
});