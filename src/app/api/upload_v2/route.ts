import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLecturesForPaper } from "@/lib/db_access/upload";
import { verifyPaperId } from "@/lib/db_access/paper";

export async function GET(req:Request){
  const {user}  = await getSessionUser();
  const userId:number = Number(user?.user_id);
  if(!userId) return new NextResponse("Unauthorized", { status: 401 });
  try{
    const {paperId} = await req.json();
    const result = await verifyPaperId(paperId, user.user_id);
    if(!result) return new NextResponse("Unauthorized", { status: 401 });
    const lectures = await getLecturesForPaper(paperId, userId);
    return NextResponse.json({status:200, lectures:lectures});
  }catch(error){
    console.error(error);
    return new NextResponse("Internal Server error", { status: 500 });
  }
}