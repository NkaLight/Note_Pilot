import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma"; 
import { z } from "zod";  

const validate_session_schema = z.object({
    token: z.string()
})

export async function GET(){
    try{

        /*Here instead of querying the database, maybe I could use a stored procedure  */
        //Get token from the user
        const token = (await cookies()).get("session_token")?.value;
        if(!token) return NextResponse.json({user:null});

        //Validate token
        validate_session_schema.parse({token});

        //get sessionID
        const sessionId = await prisma.session.findFirst({
            where:{
                token: token
            }
        })
        if(!sessionId) NextResponse.json({user: null});

        //Mark is is_used= true in DB
        const operation = await prisma.session.update({
            where: {
                session_id: sessionId?.session_id
            },
            data:{
                is_used: true
            }
        });
        console.log(operation)


        return NextResponse.json({user: null}) //Return the user object
    }catch (err){
        console.log(err)
        return NextResponse.json({user: null}) //Return null 
    }
}