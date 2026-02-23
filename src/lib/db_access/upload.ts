import { prisma } from "@/lib/db";

export async function getSourceText(uploadId:number){
    try{
        return prisma.upload.findFirst({
            select:{
                text_content:true,
            },
            where:{
                upload_id:uploadId,
            }
        })
    }catch(error){
        console.log(error);
    }
};