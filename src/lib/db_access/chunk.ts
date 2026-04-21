import { prisma } from "../db";

export async function uploadChunk(uploadId:number, chunk:string, embedding: number[]){
 const embeddingString = `[${embedding.join(",")}]`;
 return prisma.$executeRaw`
    INSERT INTO upload_chunks ("upload_id", "content", "embedding")
    VALUES (${uploadId}, ${chunk}, ${embeddingString}::public.vector)
 `;
}