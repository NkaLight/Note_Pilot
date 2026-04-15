import { test as base, expect } from "@playwright/test";
import { createIsolatedUser, cleanupUser } from "../../../../helpers/create-test-user";
import { createIsolatedPapers, cleanUpPaper} from "../../../../helpers/create-test-paper";
import { createIsolatedUploads, cleanupUploads } from "../../../../helpers/create-test-upload";

const test = base.extend<{
  uploadContext: { userId: number, paperId:number, seedLecture:any};
}>({
  uploadContext: async ({ context }, Use) => {
    const { user } = await createIsolatedUser(context);
    const firstPaper = await createIsolatedPapers(user.user_id); 
    const uploads = await createIsolatedUploads(user.user_id, firstPaper.paper_id);
    
    // Run the test with this user
    await Use({
      userId: user.user_id,
      paperId:firstPaper.paper_id,
      seedLecture:uploads
    });

    // Teardown after test completes
    await cleanupUploads(user.user_id);
    await cleanUpPaper(user.user_id);
    await cleanupUser(user.user_id);
  },
});
test.describe("Upload ", ()=>{
  test.beforeEach("Panel should become visible on hover", async ({page, uploadContext }) =>{
    await page.goto(`/paper_view/${uploadContext.paperId}/flashcards`);
    await page.locator("aside.group").hover();
    await expect(page.getByText("FILES:")).toBeVisible();
  });

  test("GET current lectures", async({page})=>{
    const listItems = page.locator("aside.group li");
    await expect(listItems).toHaveCount(4);
  });

  test("CREATE a new lecture", async({page})=>{
    const rows = page.locator("aside.group li");
    await expect(rows).toHaveCount(4);

    const fileChooserPromise = page.waitForEvent("filechooser");
    const responsePromise = page.waitForResponse(
    (r) => r.url().includes("/api/upload_v2") && r.request().method() === "POST",
    { timeout: 40000 } // Increase timeout for LLM processing
  );

    await page.getByText("Upload").click();
    const fileChooser = await fileChooserPromise;

    // This is a minimal, valid PDF structure that parser.getText() can digest
  const minimalValidPdf = Buffer.from(
    "%PDF-1.7\n" +
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n" +
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n" +
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >> endobj\n" +
    "4 0 obj << /Length 51 >> stream\n" +
    "BT /F1 12 Tf 70 700 Td (Hello World) Tj ET\n" +
    "endstream endobj\n" +
    "xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000215 00000 n\n" +
    "trailer << /Size 5 /Root 1 0 R >>\n" +
    "startxref\n315\n%%EOF"
  );

    await fileChooser.setFiles({
      name:"lecture.pdf", 
      mimeType:"application/pdf",
      buffer: minimalValidPdf,
    });
    await responsePromise;

    const uploadRows = page.locator("aside.group li");
    await expect(uploadRows).toHaveCount(5);
  });

  test("UPDATE a lecture", async ({page, uploadContext})=>{
    const newTitle = "Hover-Renamed-Lecture";

    await page.getByTestId(`edit-lecture-btn-${uploadContext.seedLecture.upload_id}`).click();

    const input = page.getByTestId(`edit-lecture-input-${uploadContext.seedLecture.upload_id}`);
    await input.fill(newTitle);

    const responsePromise = page.waitForResponse(r => r.url().includes("/api/upload_v2") && r.request().method() === "PUT");
    await page.keyboard.press("Enter");
    await responsePromise;

    await expect(page.getByText(newTitle)).toBeVisible();
  });

  test("DELETE a lecture", async ({page, uploadContext})=>{
    await page.getByTestId(`delete-lecture-btn-${uploadContext.seedLecture.upload_id}`).click();
    await page.getByTestId(`confirm-delete-lecture-btn-${uploadContext.seedLecture.upload_id}`).click();

    const listItems = page.locator("aside.group li");
    await expect(listItems).toHaveCount(3);
  });
});

