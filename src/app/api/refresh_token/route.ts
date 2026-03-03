import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z, ZodError } from "zod"; 
import { refreshLogic,} from "@/lib/services/refresh_token";
import { printCurrentSessionCache } from "@/lib/session";


/** Use ZOD to validate structure */
const validate_session_schema = z.object({
    refresh_token: z.string()
});

export async function POST(req:NextRequest){
    try{
        const refresh_token = (await cookies()).get("refresh_token")?.value;
        validate_session_schema.parse({refresh_token});
        const data = await refreshLogic(refresh_token);
        if(!data) return NextResponse.json({user:null, status:401});
        const user = data.application_user.application_user;
        console.error(user);
        printCurrentSessionCache();
        return NextResponse.json({ user: { id: user.user_id, email: user.email, username : user.username } });
    }catch(error){
        console.error(error);
        return NextResponse.json({error:"Internal server error"}, {status:500});
    }
}