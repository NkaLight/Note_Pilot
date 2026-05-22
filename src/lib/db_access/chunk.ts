import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import { verifyPaperId } from "./paper";

export async function uploadChunk(list:any){
 const values = list.map(c => {
  const embeddingString = `[${c.embedding.join(",")}]`;
  return Prisma.sql`(${c.uploadId}, ${c.content}, ${embeddingString}::public.vector, ${c.pageNumber}, ${c.embedding_model}, ${c.chunk_version})`;
});
 return prisma.$executeRaw`
    INSERT INTO upload_chunks ("upload_id", "content", "embedding", "page_num", "embedding_model", "chunk_version")
    VALUES ${Prisma.join(values)}
 `;
}

export async function similaritySearch(promptVector:any, paperId:number, userId:number):Promise<string>{
   if(!await verifyPaperId(paperId, userId))return"";
   const vectorString = `[${promptVector.join(",")}]`;
   const result = await prisma.$queryRaw<{ content: string, distance: number }[]>`
      SELECT content, embedding OPERATOR(public.<=>) ${vectorString}::public.vector as distance 
      FROM upload_chunks 
      WHERE upload_id in (
         select upload_id from upload where paper_id = ${paperId}
      ) AND embedding OPERATOR(public.<=>) ${vectorString}::public.vector < 0.25
      ORDER BY distance
      LIMIT 10;
      `;
  return result.map(row => row.content).join("\n\n");

}