import { NextRequest, NextResponse } from "next/server";
import { verifyResetToken } from "@/lib/services/reset_password";
import { resetPassword } from "@/lib/services/reset_password";

export async function PUT(req:NextRequest){
    const {password, confirmPassword, token} = await req.json();
    if(!password || !confirmPassword || !token) return NextResponse.json({error:"Fill out the form"}, {status:400});
    if(password !== confirmPassword) return NextResponse.json({error:"Passwords not equal"}, {status:400});
    const result = await verifyResetToken(token);
    if(!result) return NextResponse.json({error:"Unauthenticated"}, {status:401});
    try{
        await resetPassword(password, token);
        return NextResponse.json({message:"Password reset successfully"});
    }catch(error){
        console.error(error);
        return NextResponse.json({error:"Internal server error"}, {status:500});
    }
}