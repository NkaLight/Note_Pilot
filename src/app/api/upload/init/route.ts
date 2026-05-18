import { getSessionUser } from "@/lib/auth";
import {verifyPaperId} from "@/lib/db_access/paper";
import { NextResponse } from "next/server";
import { initUpload } from "@/lib/services/upload";

export async function POST(req:Request){
    //Auth checks
    try{
        const {user} = await getSessionUser();
        const userId = user.user_id;
        if(!userId) return new NextResponse("Unauthorized", { status: 401 });
        const formData = await req.formData();
        const paperId = formData.get("paperId");
        const authorized = await verifyPaperId(Number(paperId), Number(userId));
        if(!authorized) return new NextResponse("Unauthorized", { status: 401 });

        //Add to upload Table
        const {uploadId, signedUrl} = await initUpload(Number(paperId));
        return NextResponse.json({
            uploadUrl:signedUrl,
            uploadId:uploadId}, 
            {
                status:200
            });
    }catch(error){
        console.error(error);
        return new NextResponse("Internal Server error", {status:500});
    }

}

