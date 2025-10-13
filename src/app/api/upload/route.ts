import { getAuthedUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { PdfReader } from 'pdfreader';
import fs from 'fs';

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



async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve) => {
    try {
      console.log('Starting PDF text extraction with pdfreader');
      
      const pdfReader = new PdfReader();
      let fullText = '';
      let textArray: string[] = [];
      
      // Create a temporary file since pdfreader requires a file path
      const tempFileName = `temp_${Date.now()}.pdf`;
      const tempFilePath = tempFileName;
      
      try {
        fs.writeFileSync(tempFilePath, buffer);
        
        pdfReader.parseFileItems(tempFilePath, (err: any, item: any) => {
          if (err) {
            console.error('PDF parsing error:', err);
            // Clean up temp file
            try { fs.unlinkSync(tempFilePath); } catch (e) {}
            resolve('');
            return;
          }
          
          if (!item) {
            // End of file - process collected text
            try { fs.unlinkSync(tempFilePath); } catch (e) {}
            
            const cleanedText = textArray.join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            console.log(`PDF parsed successfully. Total text length: ${cleanedText.length} characters`);
            
            if (cleanedText.length > 0) {
              console.log('Sample extracted text:', cleanedText.substring(0, 200) + '...');
              resolve(cleanedText);
            } else {
              console.warn('No text content extracted from PDF');
              resolve('');
            }
            return;
          }
          
          if (item.text) {
            textArray.push(item.text);
          }
        });
        
      } catch (fileError) {
        console.error('Error creating temporary file:', fileError);
        resolve('');
      }
      
    } catch (error) {
      console.error('Error in PDF text extraction:', error);
      resolve('');
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
                filename: lectureTitle || name.replace(/\.[^/.]+$/, ""), // Remove extension if no title provided
                storage_path: name,
                text_content: textContent,
            }
        });

        // Log the result for debugging
        console.log(`Upload created - ID: ${upload.upload_id}, Text length: ${textContent.length}`);
        console.log("Text content preview:", textContent.substring(0, 200));

        return NextResponse.json({
            success: true,
            paper_id: upload.paper_id,
            upload_id: upload.upload_id,
            filename: upload.filename,
            textLength: textContent.length,
            fileType: ext,
            message: textContent.length > 0 
                ? "File uploaded and text extracted successfully" 
                : "File uploaded but no text content was extracted (PDF may be image-only or empty)"
        });
    } catch (err: any) {
        console.error("Upload processing error:", err);
        return NextResponse.json(
            { error: err?.message || "An internal server error occurred" },
            { status: 500 }
        );
    }
}

