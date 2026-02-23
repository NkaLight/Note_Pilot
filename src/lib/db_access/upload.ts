import { prisma } from "@/lib/db";
import { DbError } from "../error";

export async function getSourceText(uploadId:number){
    try{
        return prisma.upload.findFirst({
            select:{
                text_content:true,
            },
            where:{
                upload_id:uploadId,
            }
        });
    }catch(error){
        throw new DbError("Failed to get the textContent from upload attribute");
    }
}