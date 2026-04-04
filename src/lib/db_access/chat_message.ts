import { prisma } from "../db";

export async function getChatMessages(uploadId:number, userId:number){
    return await prisma.chat_message.findMany({
        where:{
            user_id:userId,
            upload_id:uploadId,
        }
    });
}
export async function clearChatMessages(uploadId:number, userId:number){
    return await prisma.chat_message.deleteMany({
        where:{
            user_id:userId,
            upload_id:uploadId,
        }
    });
}
export async function saveNewMessages(uploadId:number, userId:number,content:string, reply:string){
    if (!uploadId || !userId) throw new Error(`Invalid arguments: uploadId=${uploadId}, userId=${userId}`);

    return await prisma.$transaction(async(tr)=>{
        await tr.chat_message.create({
            data: { upload_id:uploadId, user_id: userId, role: "user", content: content }
        });
        return await tr.chat_message.create({
            data:{ upload_id: uploadId, user_id:userId, role:"assistant", content:reply}
        });
    });
}