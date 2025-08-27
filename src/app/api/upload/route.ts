import { NextResponse } from "next/server";
import { pdf_processing } from "@/lib/pdf_processing";
import { summarizeWithOllama } from "@/lib/ollama";
//import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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


export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const name = file.name || "Untitled";
    const isTxt =
      file.type.startsWith("text/") || name.toLowerCase().endsWith(".txt");
    const isPdf =
      file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");

    let text = "";

    if (isTxt) {
      text = Buffer.from(await file.arrayBuffer()).toString("utf8").trim();
    } else if (isPdf) {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await pdf_processing(buffer)
    } else {
      return NextResponse.json(
        { error: "Unsupported file type; please use .txt or .pdf" },
        { status: 415 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 422 }
      );
    }

    const summary = await summarizeWithOllama(text);

    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Summarization failed" },
      { status: 500 }
    );
  }
}
