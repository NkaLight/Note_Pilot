import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db"; 
import { z } from "zod";  
import {clearCache} from "@/lib/session";

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

        //clear session in cache
        const clearedCache = await clearCache();
        if(!clearedCache){
             console.log("failed to clear cache");
             return NextResponse.json({user:null, error:"Failed to clear cache"}) 
        }

        //Mark is is_used= true in DB
        const operation = await prisma.session.update({
            where: {
                session_id: sessionId?.session_id
            },
            data:{
                is_used: true
            }
        });


        return NextResponse.json({user: null}) //Return the user object
    }catch (err){
        console.log(err)
        return NextResponse.json({user: null}) //Return null 
    }
}