import { getSessionUser } from "@/lib/auth";
import { verifyUploadId, updateFileName } from "@/lib/db_access/upload";
import { getLectureTitle } from "@/lib/services/upload";
import { NextResponse } from "next/server";
import { pyClient } from "@/lib/externals/pyClient";

export async function POST(req:Request){
    const {user} = await getSessionUser();
    if(!user.user_id) return new NextResponse("Unauthorized", {status:401});
    const formData = await req.formData();
    try{
        const uploadId = Number(formData.get("uploadId"));
        const paperId = Number(formData.get("paperId"));
        const isValid = await verifyUploadId(uploadId, user.user_id);
        if(!isValid) return new NextResponse("Unauthorized", {status:401});

        //Call the Python service.
        const {context} = await pyClient.ingest(String(uploadId));
        if(!context){
            console.error("error getting the context.");
            return NextResponse.json({error:"Error generating the lecture title"}, {status:500});
        }
        console.error(`Generating the lecture title from context ${context.length}`);
        const lectureTitle:string = await getLectureTitle(context);
        await updateFileName(lectureTitle, uploadId, paperId, user.user_id);
        return NextResponse.json({title: lectureTitle}, {status:200});
    }catch(error){
        console.error(error);
        return NextResponse.json({error:"Internal Server error"}, {status:500});
    }
};