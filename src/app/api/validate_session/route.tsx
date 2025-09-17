import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma"; 
import { email, z } from "zod";  

const validate_session_schema = z.object({
    token: z.string()
})

export async function GET(){
    try{
        //Get token from the user
        const token = (await cookies()).get("session_token")?.value;
        if(!token) return NextResponse.json({user:null});

        //Validate token
        validate_session_schema.parse({token});

        //Check in DB
        const session = await prisma.session.findFirst({
            where:{
                token, 
                expires_at:{gt: new Date()}, //check is still valid
                is_used: false,
            },
            include:{
                application_user: true,
            },
        });
        if(!session) return NextResponse.json({user:null, status: 401});

        const user ={
            user_id: session.application_user.user_id,
            email: session.application_user.email,
            username: session.application_user.username,
        }
        return NextResponse.json({user: user, status:200}) //Return the user object
    }catch (err){
        console.log(err)
        return NextResponse.json({user: null, status: 500}) //Return null 
    }
}