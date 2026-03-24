import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { CanvasFactory } from 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';
import { getPath, getData } from 'pdf-parse/worker';
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
    const lectureTitle = formData.get("lectureTitle") as string | null;

    if (!uploadedFiles.length || !paperId || !lectureTitle) {
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
