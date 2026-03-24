import { getSessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateSummaries } from "@/lib/services/summaries";
import { getSummaries } from "@/lib/db_access/summaries";

export async function GET(req:Request){
    try{
        const {user} = await getSessionUser();
        if(!user) return NextResponse.json({error:"Unauthenticated"}, {status:401});
        const { searchParams } = new URL(req.url); // Since this is a server-side hook this is the only work around I have.
        const uploadId = searchParams.get("uploadId");
        const summaries  = await getSummaries(Number(uploadId), user.user_id);
        return NextResponse.json({summaries});
    }catch(error){
        console.error(error);
        return NextResponse.json({error:"Internal server error"}, {status:500});
    }
}

export async function POST(req:Request){
    try{
        const {user} = await getSessionUser();
        if(!user) return NextResponse.json({error:"Unauthenticated"}, {status:401});
        const {uploadId} = await req.json();
        const summaries = await generateSummaries(Number(uploadId), user.user_id);
        
        return NextResponse.json({summaries});
    }catch(error){
        console.error(error);
        return NextResponse.json({error:"Failed to generate summaries, try again later"}, {status:500});
    }
}