import { test as base, expect } from '@playwright/test';
import { createIsolatedUser, cleanupUser } from "../../../../helpers/create-test-user";
import { createIsolatedPapers } from '../../../../helpers/create-test-paper';
import { createIsolatedUploads } from '../../../../helpers/create-test-upload';

const test = base.extend<{
  testUser: { userId: number };
}>({
  testUser: async ({ context }, Use) => {
    const { user } = await createIsolatedUser(context);
    const paper = await createIsolatedPapers(user.user_id); 
    const uploads = await createIsolatedUploads(user.user_id, paper.paper_id);
    
    // Run the test with this user
    await Use({
      userId: user.user_id,
    });
    // Teardown after test completes
    await cleanupUser(user.user_id);
  },
});


