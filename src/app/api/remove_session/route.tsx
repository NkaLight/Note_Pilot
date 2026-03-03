import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";  
import { markAsUsed } from "@/lib/db_access/refresh_token";

/**
 * Removes the user session.
 * @description Retrieve access token from header, clear from cache, mark refresh token as used in DB.
 * @returns the user object or null if session is invalid/expired.
 */
export async function POST(req:NextResponse){
    try{
        const access_token = (await cookies()).get("access_token");
        const refresh_token =  (await cookies()).get("refresh_token");
        
        await markAsUsed(refresh_token.value);

        (await cookies()).delete("access_token");
        (await cookies()).delete("refresh_token");

    }catch(error){
        console.error(error);
        return null;
    }
}
