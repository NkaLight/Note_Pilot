import { NextResponse } from "next/server";
import { uploadChunk } from "@/lib/db_access/chunk";

export async function POST(req:Request){
    const secrete = req.headers.get("x-internal-secret");
    if(secrete !== process.env.INTERNAL_SHARED_SECRETE){
        return NextResponse.json({error : "unAuthorized"}, {status: 401});
    }
    const {uploadId, content, embedding} = await req.json();
    if(!uploadId || !content || !embedding){
        return NextResponse.json({error: "Invalid request"}, {status:400});
    }
    if (!Array.isArray(embedding) || embedding.length !== 1024) {
        return NextResponse.json(
            { error: "Invalid embedding dimensions. Expected 1024." }, 
            { status: 400 }
        );
    }
    try{
        await uploadChunk(Number(uploadId), content, embedding);
        return NextResponse.json({message:"Success"}, {status:201});
    }catch(error){
        console.error(error);
        return NextResponse.json({error:"Internal sever error"}, {status:500});
    }
}