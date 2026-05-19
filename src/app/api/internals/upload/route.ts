import { addTextContent, updateUploadStatus } from "@/lib/db_access/upload";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export async function PATCH(req:NextRequest){
    const headersList = await headers();
    const secrete = headersList.get("x-internal-secret");
    if(secrete !== process.env.INTERNAL_SHARED_SECRETE){
        return NextResponse.json({error : "unAuthorized"}, {status: 401});
    }
    try{
        const body = await req.json();
        const {method, uploadId, textContent, status} = body;
        if(method === "textContent"){
            await addTextContent(textContent, Number(uploadId));
        }else if(method === "status"){
            await updateUploadStatus(status, Number(uploadId));
        }else{
            return NextResponse.json({error:"Invalid request"}, {status:400});
        }
        return NextResponse.json({message:"Success"}, {status:200});
    }catch(error){
        console.error(error);
        return NextResponse.json({error:"Internal server error"}, {status:500});
    }
}