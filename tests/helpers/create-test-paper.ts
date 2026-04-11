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
 * Util function for testing the functionality dependent on Papers.
 * @param userId 
 * @returns firstPaper object
 */
export async function createIsolatedPapers(userId:number){

    const firstPaper = await prisma.paper.create({
        data:{
                name: `PaperExample-unique${crypto.randomBytes(4).toString("hex")}`,
                user_id:userId,
                description:`DescriptionExample${crypto.randomBytes(4).toString("hex")}`,
                code:`${crypto.randomBytes(4).toString()}`
        }
    });
    await prisma.paper.createMany({
        data:[
            {
                name: `PaperExample-unique${crypto.randomBytes(4).toString("hex")}`,
                user_id:userId,
                description:`DescriptionExample${crypto.randomBytes(4).toString("hex")}`,
                code:`${crypto.randomBytes(4).toString()}`
            },
            {
                name: `PaperExample-unique${crypto.randomBytes(4).toString("hex")}`,
                user_id:userId,
                description:`DescriptionExample${crypto.randomBytes(4).toString("hex")}`,
                code:`${crypto.randomBytes(4).toString()}`
            },
        ],
    });
    return firstPaper;
}

/**
 * @param userId
 * @return the first paperId found by userId
 */
export async function getPaperId(userId:number):Promise<number>{
    const data =  await prisma.paper.findFirst({
        select:{
            paper_id:true
        }, 
        where:{
            user_id:userId,
        }
    });
    return data.paper_id;
}
