import { Prisma } from "@prisma/client";
import { DbError } from "../error";
import { prisma } from "../db";

export async function getUser(refresh_token:string){
    return await prisma.session.findUnique({
        where:
        {
            token: refresh_token, 
            is_used:false
        },
        select:{
            application_user:true,
        }
    });
}