import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import { verifyUploadId } from "./upload";

export async function uploadChunk(list:any){
 const values = list.map(c => {
  const embeddingString = `[${c.embedding.join(",")}]`;
  return Prisma.sql`(${c.uploadId}, ${c.content}, ${embeddingString}::public.vector), ${c.page_num}, ${c.embedding_model}, ${c.chunk_version}`;
});
 return prisma.$executeRaw`
    INSERT INTO upload_chunks ("upload_id", "content", "embedding", "page_num", "embedding_model", "chunk_version")
    VALUES ${Prisma.join(values)}
 `;
}

export async function similaritySearch(promptVector:any, uploadId:number, userId:number){
   const {upload_id} = await verifyUploadId(uploadId, userId);
   if(!upload_id) throw new Error("Unauthorized access");
   const vectorString = `[${promptVector.join(",")}]`;
   console.error(vectorString);
   const result = await prisma.$queryRaw<{ content: string }[]>`
      SELECT content, embedding OPERATOR(public.<=>) ${vectorString}::public.vector as distance 
      FROM upload_chunks 
      WHERE upload_id = ${uploadId} 
      ORDER BY distance
      LIMIT 3;
      `;
   
  if (!result || result.length === 0) throw new Error("Error fetching context");

  return result.map(row => row.content).join("\n\n");
}