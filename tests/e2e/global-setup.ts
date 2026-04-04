/* eslint-disable no-console */
import { execSync } from "child_process";

async function globalSetup() {
  console.log("🚀 Global setup: preparing test database...");
  
  const url = process.env.DATABASE_URL;

  execSync("npx prisma db push --accept-data-loss", {
    env: { 
      ...process.env, 
      DATABASE_URL: url, 
      DIRECT_URL: process.env.DIRECT_URL 
    },
    stdio: "inherit",
  });

  console.log("✅ Test database ready.");
}

export default globalSetup;