import { getSessionUser } from "@/lib/auth";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { deleteUpload, updateFileName, verifyUploadId } from "@/lib/db_access/upload";
import { getDownloadPdfUrl } from "@/lib/services/upload";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }>}){
    const {user} = await getSessionUser();
    const userId:number = Number(user?.user_id);
    if(!userId) return NextResponse.json({status:401, error:"Unauthorized"});
    try{
        const {id} = await params;
        const uploadId = Number(id);
        await deleteUpload(Number(uploadId), userId);
        return NextResponse.json({status:200, message:"Successful"});
    }catch(error){
        console.error(error);
        return NextResponse.json({status:500, error:"Internal server error"});
    }
}
export async function PUT({req, params}:{req:NextRequest, params: Promise<{id:string}>}){
    const {user} = await getSessionUser();
    const userId:number = Number(user?.user_id);
    if(!userId) return NextResponse.json({status:401, error:"Unauthorized"});
    try{
        const formData = await req.formData();
        const newFileName = formData.get("newFileName") as string|null;
        const {id} = await params;
        const uploadId:number|null = Number(id);
        if(!uploadId){
              return new NextResponse("Invalid request", {status:400});
            }
        await updateFileName(newFileName, uploadId, userId);
        return NextResponse.json({status:200, message:"Successful"});
    }catch(error){
        console.error(error);
        return NextResponse.json({status:500, error:"Internal server error"});
    }
}
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }){
    const {user} = await getSessionUser();
    const userId:number = Number(user?.user_id);
    if(!userId) return NextResponse.json({status:401, error:"Unauthorized"});
    try{
        const {id} = await params;
        const uploadId:number|null = Number(id);
        if(!uploadId) return NextResponse.json({status:400, error:"Invalid request"});
        // Verify authorization
        const result = await verifyUploadId(uploadId, userId);
        if(!result) return NextResponse.json({status:401, error:"Unauthorized"});
        const {signedUrl} = await getDownloadPdfUrl(uploadId);
        return NextResponse.json({
            downloadUrl:signedUrl,
            status:200
        });
    }catch(error){
        console.error(error);
        return NextResponse.json({status:500, error:"Internal Server error"});
    }
};
