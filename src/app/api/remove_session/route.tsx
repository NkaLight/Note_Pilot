import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db"; 
import { z } from "zod";  
import {clearCache} from "@/lib/session";

/**
 * API route for removing user session.
 * Clears the session both from the database and the cache.
 */


/** Use ZOD to validate structure */
const validate_session_schema = z.object({
    token: z.string()
})

/**
 * Removes the user session.
 * @description Fetch session, clear from cache, mark as used in DB.
 * @returns the user object or null if session is invalid/expired.
 */
export async function GET(){
    try{

        /* TODO: Handle using a stored procedure  */
        
        // Get token from the user
        const token = (await cookies()).get("session_token")?.value;
        if(!token) return NextResponse.json({user:null});

        // Validate token
        validate_session_schema.parse({token});

        // Get sessionID
        const sessionId = await prisma.session.findFirst({
            where:{
                token: token
            }
        })
        if(!sessionId) NextResponse.json({user: null});

        // Clear session in cache
        const clearedCache = await clearCache();
        if(!clearedCache){
             console.log("failed to clear cache");
             return NextResponse.json({user:null, error:"Failed to clear cache"}) 
        }

        // Mark is is_used= true in DB
        const operation = await prisma.session.update({
            where: {
                session_id: sessionId?.session_id
            },
            data:{
                is_used: true
            }
        });

        return NextResponse.json({user: null})
    }catch (err){
        console.log(err)
        return NextResponse.json({user: null}) 
    }
}