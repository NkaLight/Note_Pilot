import { prisma } from "../db";

export async function storeResetTokenHash(tokenHash, user){
    await prisma.refresh_token.create({
        data:{
            token_hash:tokenHash,
            user_id:user.user_id
        }
    });
}

export async function getResetToken(tokenHash:string){
    await prisma.reset_token.findUnique({
        where:{
            token_hash:tokenHash
        },
        include:{
            application_user:true
        },
    });
}
