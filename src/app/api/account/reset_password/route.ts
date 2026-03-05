import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/services/user";

export async function POST(req:NextRequest){
    const {token, newPassword} = await req.json();
    try{
        const result = await resetPassword(token, newPassword);
        return NextResponse.json({message:"Email reset successful please relogin"}, {status:200});
    }catch(error){
        console.error(error);
        return NextResponse.json({error:"Internal server error"}, {status:500});
    }
}
