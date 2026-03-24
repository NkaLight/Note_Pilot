import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z, } from "zod"; 
import { refreshLogic,} from "@/lib/services/refresh_token";
import { markAsUsed } from "@/lib/db_access/refresh_token";


/** Use ZOD to validate structure */
const validate_session_schema = z.object({
    refresh_token: z.string()
});

/*Using the refresh token, get the access token.*/
export async function POST(req:NextRequest){
    try{
        const refresh_token = (await cookies()).get("refresh_token")?.value;
        validate_session_schema.parse({refresh_token});
        const user = await refreshLogic(refresh_token);
        if(!user) return NextResponse.json({user:null, status:401});
        return NextResponse.json({ user: { email: user.email} });
    }catch(error){
        console.log(error);
        return NextResponse.json({error:"Internal server error"}, {status:500});
    }
}
/**
 * Removes the user session.
 * @description Retrieve access token from header, clear from cache, mark refresh token as used in DB.
 * @returns the user object or null if session is invalid/expired.
 */
export async function PUT(req:NextRequest){
    try{
        const refresh_token =  (await cookies()).get("refresh_token");
        if(refresh_token?.value){
            await markAsUsed(refresh_token.value);
        }
        const cookieJar = await cookies();
        cookieJar.delete("session_token");
        cookieJar.delete({name:"refresh_token", path: "/api/refresh_token"});

        return NextResponse.json({message: "Logout successful"}, {status:200});
    }catch(error){
        return NextResponse.json({error: "Internal server error"}, {status:500});
    }
}