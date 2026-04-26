import { prisma } from "../db";
import { Prisma } from '@prisma/client';
import { verifyUploadId } from "./upload";

export async function uploadChunk(list:any){
 const values = list.map(c => {
  const embeddingString = `[${c.embedding.join(",")}]`;
  return Prisma.sql`(${c.uploadId}, ${c.content}, ${embeddingString}::public.vector)`;
});
 return prisma.$executeRaw`
    INSERT INTO upload_chunks ("upload_id", "content", "embedding")
    VALUES ${Prisma.join(values)}
 `;
}

export async function similaritySearch(promptVector:any, uploadId:number, userId:number){
   const {upload_id} = await verifyUploadId(uploadId, userId);
   if(!upload_id) throw new Error("Unauthorized access");
   const vectorString = `[${promptVector.join(",")}]`;
   console.error(vectorString);
   const result = await prisma.$queryRaw<{ content: string }[]>`
      SELECT content FROM upload_chunks 
      WHERE upload_id = ${uploadId} 
      ORDER BY embedding OPERATOR(public.<=>) ${vectorString}::public.vector 
      LIMIT 5;
      `;
   
  if (!result || result.length === 0) throw new Error("Error fetching context");

  return result.map(row => row.content).join("\n\n");
}