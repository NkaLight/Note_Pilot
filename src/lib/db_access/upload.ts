import { prisma } from "@/lib/db";
import { DbError } from "../error";

export async function getSourceText(uploadId:number, userId:number){
    try{
        return prisma.upload.findFirst({
            select:{
                text_content:true,
            },
            where:{
                upload_id:uploadId,
                paper:{
                    user_id:userId,
                }
            }
        });
    }catch{
        throw new DbError("Failed to get the textContent from upload attribute");
    }
}

export async function verifyUploadId(uploadId:number, userId:number){
    try{
        return prisma.upload.findFirst({
            select:{
                upload_id:true
            },
            where:{
                upload_id:uploadId,
                paper:{
                    user_id:userId
                }
            }
        });
    }catch{
        throw new DbError("Failed to get the uploadContent");
    }
}

type Lecture = {
  id: number;
  title: string;
  createdAt: Date;
};

export async function getLecturesForPaper(paperId:number, userId:number):Promise<Lecture[]> {
    try{
        const result = await prisma.upload.findMany({
            where:{
                paper_id:paperId,
                paper:{
                    user_id:userId
                }
            },
            orderBy:{
                    uploaded_at:"desc",
                },
            select: {
                upload_id: true,
                filename: true,
                uploaded_at: true,
            },
        });
        return result.map(({upload_id, filename, uploaded_at}) => ({id:upload_id,title:filename, createdAt:uploaded_at})); 

    }catch(error){
        throw new DbError(`Error getLecturesForPaper DbError \n\n${error}\n\n`);
    }
}
export async function updateFileName(newFileName:string, uploadId:number, paperId:number, userId:number){
    await prisma.upload.update({
        data:{
            filename:newFileName,
        },
        where:{
            upload_id:uploadId,
            paper_id:paperId,
            paper:{
                paper_id:paperId,
                user_id:userId
            }

        }
    });
}

export async function deleteUpload(paperId:number, uploadId:number, user_id:number){
    await prisma.upload.delete({
        where:{
            upload_id:uploadId,
            paper_id: paperId,
            paper:{
                user_id:user_id
            }
        }
    });
}