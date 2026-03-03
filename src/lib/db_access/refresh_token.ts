import { prisma } from "@/lib/db";
import { DbError } from "../error";

export async function markAsUsed(refresh_token:string){
    try{
        await prisma.session.update({
        data:{
            is_used:true,
        },
        where:{
            token:refresh_token,
        },
    });
    }catch(error){
        throw new DbError(error);
    }
}