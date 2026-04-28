/* eslint-disable no-console */
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

async function globalSetup() {
  console.log("🚀 Global setup: preparing test database...");
  const prisma = new PrismaClient();

  const url = process.env.DATABASE_URL;
  try{
    await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
    console.log("Vector extension created successfully");
    await prisma.$disconnect();
    execSync("npx prisma db push --accept-data-loss", {
    env: { 
      ...process.env, 
      DATABASE_URL: url, 
      DIRECT_URL: process.env.DIRECT_URL 
    },
    stdio: "inherit",
  });
  }catch(e){
    console.error(e);
  }
}

export default globalSetup;