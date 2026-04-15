import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

// Each worker process loads env vars independently
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL }},
});

/**
 * 
 * @param userId 
 * @param paperId 
 * @return a the firstUpload object.
 */
export async function createIsolatedUploads(userId:number, paperId:number){
    const firstUpload = await prisma.upload.create({
        data:
            {
                filename:`UniqueFileName-${crypto.randomBytes(4).toString("hex")}`,
                paper_id:paperId,
                storage_path: `Upload StoragePath-${crypto.randomBytes(4).toString("hex")}`
            }
    });
    await prisma.upload.createMany({
        data:[
            {
                filename:`UniqueFileName-${crypto.randomBytes(4).toString("hex")}`,
                paper_id:paperId,
                storage_path: `Upload StoragePath-${crypto.randomBytes(4).toString("hex")}`
            },
            {
                filename:`UniqueFileName-${crypto.randomBytes(4).toString("hex")}`,
                paper_id:paperId,
                storage_path: `Upload StoragePath-${crypto.randomBytes(4).toString("hex")}`
            },
            {
                filename:`UniqueFileName-${crypto.randomBytes(4).toString("hex")}`,
                paper_id:paperId,
                storage_path: `Upload StoragePath-${crypto.randomBytes(4).toString("hex")}`
            },
        ]
    });
    return firstUpload;
    
}

export async function cleanupUploads(userId:number){
    await prisma.upload.deleteMany({
        where:{
            paper:{
                user_id:userId
            }
        }
    });
}