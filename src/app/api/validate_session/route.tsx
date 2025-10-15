import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session";
import { z } from "zod";  

/**
 * API route to validate user session and return user info.
 */


/** Zod schema validation */
const validate_session_schema = z.object({
    token: z.string()
})

/** A function to retrieve user data
 * @returns user object or null if not authenticated
 */
export async function GET(){
    try{
        // Get token from the user
        const token = (await cookies()).get("session_token")?.value;
        if(!token) return NextResponse.json({user:null, status:401});

        // Validate token
        validate_session_schema.parse({token});

        // Validate session (Server-side || DB-side) Faster lookup, in memory.
        const session = await validateSession(token);
        if(!session) return NextResponse.json({user:null, status: 401});
        const user ={
            user_id: session.application_user.user_id,
            email: session.application_user.email,
            username: session.application_user.username,
        }
        return NextResponse.json({user: user, status:200}) //Return the user object
    }catch (err){
        return NextResponse.json({user: null, status: 500}) //Return null 
    }
}