import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getUserByEmail, setNewPassword } from "../db_access/user";
import { prisma } from "../db";
import { NextResponse } from "next/server";

export async function createPasswordResetToken(email:string){
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await getUserByEmail(email);
    if(!user) throw new Error("User does not exist");
    await prisma.reset_token.create({
        data:{
            token_hash:tokenHash,
            user_id:user.user_id
        }
    });
    return rawToken;
}
export async function verifyResetToken(rawToken:string){
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const result = await prisma.reset_token.findUnique({
        where:{
            token_hash:tokenHash, 
            is_used:false, 
            expires_at:{
                gt: new Date()
            },
        }
    });
    return result ? true : false;
}
export async function resetPassword(newPassword:string, rawToken:string){
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    //Make reset_token invalid
    const result = await prisma.reset_token.findUnique({
        where:{
            token_hash:tokenHash, 
            is_used:false
        },
        include:{
            application_user:true,
        },
    });
    await prisma.reset_token.update({
        data:{
            is_used:true, 
        },
        where:{
            token_hash:result.token_hash
        }
    });
    const newPassHash = await bcrypt.hash(newPassword, 10);
    await setNewPassword(newPassHash, result.application_user.user_id);
    return true;
}