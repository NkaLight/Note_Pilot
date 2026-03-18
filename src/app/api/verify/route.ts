import { NextRequest, NextResponse } from "next/server";
import { verifyResetToken } from "@/lib/services/reset_password";

export async function POST(req:NextRequest){
    const {token} = await req.json();
    if(!token) return NextResponse.json({error:"Unauthenticated"}, {status:401});
    
    try{
        console.error("Retrieved ", token);
        const result = await verifyResetToken(token);
        console.error("Token already used or invalid");
        if(!result) return NextResponse.json({error:"Unauthenticated"}, {status:401});
        return NextResponse.json({message:"tokenVerified"});

    }catch(error){
        console.error(error);
        return NextResponse.json({error:"Internal server error"}, {status:500});
    }
}