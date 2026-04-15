import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLectureTitle} from "@/lib/services/upload";
import { updateFileName, deleteUpload } from "@/lib/db_access/upload";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { getData } from "pdf-parse/worker";
import { prisma } from "@/lib/db";

/**
 * A function to handle file uploads (PDF and TXT).
 * Extracts text content from the files and stores them in the database.
 * Currently text extraction is done within the function, but should be moved to lib.
 */
export async function POST(req: Request) {
  PDFParse.setWorker(getData());
  try {

    // Get the user ID from the authentication token
    const {user} = await getSessionUser();
    const userId = user.user_id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse FormData
    const formData = await req.formData();
    const uploadedFiles = formData.getAll("file"); 
    const paperId = formData.get("paperId") as string | null;

    if (!uploadedFiles.length || !paperId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const uploadedFile = uploadedFiles[0] as File;
    if (!(uploadedFile instanceof File)) {
      return new NextResponse("Invalid file", { status: 400 });
    }

    /*PDFPARSER documentation within serveless environment https://mehmet-kozan.github.io/pdf-parse/typedoc/documents/troubleshooting.html */
    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
    const parser = new PDFParse({data:fileBuffer, verbosity: 0, CanvasFactory });
    const parsed = await parser.getText();
    const parsedText = parsed.text;
    parser.destroy();

    //Dynamically generate the lecture for the user.
    const lectureTitle:string = await getLectureTitle(parsed.text.slice(0, 100));

    //Send to DB
    const papId = parseInt(paperId, 10); // convert to int
    await prisma.upload.create({
        data: {
            paper_id: papId,
            filename: lectureTitle,
            text_content: parsedText,
            storage_path: uploadedFile.name,
        }
    });
    return NextResponse.json({
      status: 200,
      paperId,
      lectureTitle
    });
  } catch (err: any) {
    console.error("Forwarding API error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

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