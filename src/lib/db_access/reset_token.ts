import { prisma } from "../db";

export async function storeResetTokenHash(tokenHash:string, user){
    await prisma.reset_token.create({
        data:{
            token_hash:tokenHash,
            user_id:user.user_id,
        },
    });
}

export async function getUserFromTokenHash(tokenHash:string){
    return await prisma.reset_token.findUnique({
        where:{
            token_hash:tokenHash
        },
        include:{
            application_user:true
        },
    });
}
