import { usePaperViewContext } from "@/context/PaperViewContext";
import { getAuthedUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { error } from "console";
import { useParams } from "next/navigation";
import { NextResponse } from "next/server";
import pdf2json from "pdf2json";

export const runtime = "nodejs";

// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-started-nodejs.html
/*
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// uploads a file to a bucket
const s3Key = `${user_id}/${fileName}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: s3Key,
      Body: fileBuffer,
    })
);

// create a record in the database for the paper and upload, not sure how to handle this yet
const paper = await prisma.paper.create({
    data: {
      user_id: userId,
      filename: fileName,
    },
});

await prisma.upload.create({
    data: {
      paper_id: paper.paper_id,
      filename: fileName,
      storage_path: s3Key,
    },
});
*/



function extractTextFromPDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new pdf2json();
        
        pdfParser.on("pdfParser_dataError", errData => {
            console.error("PDF parsing error:", errData);
            reject(new Error(`PDF parsing failed: ${errData.parserError || errData}`));
        });
        
        pdfParser.on("pdfParser_dataReady", pdfData => {
            try {
                if (!pdfData || !pdfData.formImage) {
                    console.log("PDF data structure:", JSON.stringify(pdfData, null, 2));
                    resolve(""); // Return empty string for unparseable PDFs
                    return;
                }
                
                if (!pdfData.formImage.Pages || pdfData.formImage.Pages.length === 0) {
                    console.log("No pages found in PDF, returning empty string");
                    resolve(""); // Return empty string instead of rejecting
                    return;
                }
                
                const text = pdfData.formImage.Pages.map(page => {
                    if (!page.Texts || page.Texts.length === 0) return "";
                    return page.Texts.map(t => {
                        try {
                            return decodeURIComponent(t.R[0].T);
                        } catch (e) {
                            return t.R[0].T; // Fallback if decoding fails
                        }
                    }).join(" ");
                }).join("\n").trim();
                
                resolve(text || ""); // Ensure we always return a string
            } catch (error) {
                console.error("Error processing PDF data:", error);
                resolve(""); // Return empty string on any processing error
            }
        });
        
        try {
            pdfParser.parseBuffer(buffer);
        } catch (error) {
            console.error("Error starting PDF parse:", error);
            reject(new Error(`Failed to start PDF parsing: ${error}`));
        }
    });
}

export async function POST(req: Request) {
    try {
        const userId = await getAuthedUserId();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const form = await req.formData();
        const file = form.get("file") as File | null;
        const paperId = form.get("paperId") as string | null;
        const lectureTitle = form.get("lectureTitle") as string | null
        if (!file && !paperId ) {
            return new NextResponse("File could not be processed", { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const name = file.name; // Probably want to store them from user inputs
        const ext = file.name.split('.').pop()?.toLowerCase();

        let textContent = "";
        if (ext === "pdf") {
            try {
                textContent = await extractTextFromPDF(buffer);
                if (!textContent.trim()) {
                    console.log("PDF extraction returned empty text, but continuing with upload");
                }
            } catch (error) {
                console.error("PDF extraction failed:", error);
                // Continue with empty text content for problematic PDFs
                textContent = "";
            }
        } else if (ext === "txt") {
            textContent = buffer.toString("utf-8");
        } else {
            return new NextResponse("Unsupported file type. Please upload PDF or TXT files.", { status: 415 });
        }

        
        // Store upload with extracted text
        const papId = parseInt(paperId, 10)
        const upload = await prisma.upload.create({
            data: {
                paper_id: papId,
                filename: lectureTitle?lectureTitle:"",// Probably want to store the filename as lecture title, since we are storing the "storage path"
                storage_path: name,
                text_content: textContent,
            }
        });

        return NextResponse.json({
            success: true,
            paper_id: upload.paper_id,
            upload_id: upload.upload_id,
            textLength: textContent.length,
            fileType: ext
        });
    } catch (err: any) {
        console.error("Upload processing error:", err);
        return NextResponse.json(
            { error: err?.message || "An internal server error occurred" },
            { status: 500 }
        );
    }
}

