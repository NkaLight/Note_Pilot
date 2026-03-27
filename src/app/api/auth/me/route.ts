import { getSessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET():Promise<NextResponse>{
    const {user} = await getSessionUser();
    if(!user){
        return NextResponse.json({user: null}, {status:401});
    }
    return NextResponse.json({ user });
}
