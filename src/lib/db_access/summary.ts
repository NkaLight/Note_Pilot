import { prisma } from "@/lib/db";
import { DbError } from "../error";

export async function getSummary(uploadId:number, user_id:number){
    try{
        return await prisma.summary.findMany({
            select:{
                text_content:true
            },
            where:{
                upload_id:uploadId,
                upload:{
                    paper:{
                        user_id:user_id,
                    }
                }
            }
        });
    }catch(error){
        throw new DbError(`Error getSummaries DbError \n\n${error}\n\n`);
    }
}
export async function saveSummary(uploadId:number, userId:number, textContent:string){
    try{
        const valid = await prisma.upload.findFirst({
                where: {
                upload_id: uploadId,
                paper: { user_id: userId },
                },
                select: { upload_id: true },
            });
            if (!valid) {
                throw new Error("Unauthorized");
            }

            return await prisma.summary.create({
                data:{
                    upload_id:uploadId,
                    text_content:textContent
                },
            });
        }catch(error){
            throw new DbError(`Error saveSummaries DbError \n\n${error}\n\n`);
        }
}