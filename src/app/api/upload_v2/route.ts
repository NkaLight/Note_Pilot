import { NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import PDFParser from "pdf2json";
import os from "os";
import path from "path";
import { prisma } from "@/lib/db";


export async function POST(req: Request) {
  try {
    //auth
    const userId = getAuthedUserId();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    //Parse FormData
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

    console.log("Received file:", uploadedFile.name, uploadedFile.size, uploadedFile.type);

    // Write temp PDF file
    const fileName = uuidv4();
    const tmpFilePath = path.join(os.tmpdir(), `${fileName}.pdf`);
    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
    console.log("File buffer size:", fileBuffer.length);
    await fs.writeFile(tmpFilePath, fileBuffer);

    // Parse PDF
    const pdfParser = new (PDFParser as any)(null, 1); 
    let parsedText = "";

    await new Promise<void>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error("PDF parsing error:", errData.parserError);
        reject(errData.parserError);
      });

      pdfParser.on("pdfParser_dataReady", () => {
        parsedText = pdfParser.getRawTextContent();
        console.log("Parsed text:", parsedText);
        resolve();
      });

      pdfParser.loadPDF(tmpFilePath);
    });

    await fs.unlink(tmpFilePath).catch(() => {});


    //Send to DB
    const papId = parseInt(paperId, 10) // convert to int
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
