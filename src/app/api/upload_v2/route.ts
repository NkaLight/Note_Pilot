import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateFileName, deleteUpload } from "@/lib/db_access/upload";

export async function PUT(req:Request){
  const {user} = await getSessionUser();
  const userId:number = Number(user.user_id);
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try{
    const formData = await req.formData();
    const paperId = formData.get("paperId") as string | null;
    const uploadId = formData.get("uploadId") as string | null;
    const newFileName = formData.get("newFileName") as string|null;
    if(!paperId || !uploadId){
      return new NextResponse("Invalid request", {status:400});
    }
    await updateFileName(newFileName, Number(uploadId), Number(paperId), userId);
    return NextResponse.json({status:200, message:"Successful"});
  }catch(error){
      console.error(error);
      return NextResponse.json({error: "Internal server erorr"}, {status:500});
  }
}

export async function DELETE(req:Request){
  const user = await getSessionUser();
  if(!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try{
    const formData = await req.formData();
    const paperId = formData.get("paperId") as string | null;
    const uploadId = formData.get("uploadId") as string | null;
    if(!paperId || !uploadId){
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    await deleteUpload(Number(paperId), Number(uploadId), user.user_id);
    return NextResponse.json({status:200, message:"Successful"});
  }catch(error){
    console.error(error);
    return NextResponse.json({error: "Internal server erorr"}, {status:500});
  }
}