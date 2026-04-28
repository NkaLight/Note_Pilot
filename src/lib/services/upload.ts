import { ServiceType } from "../error";
import { queryLLM } from "../utils/ai-gateway";
import { s3Client } from "@/lib/S3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {createNewUpload} from "@/lib/db_access/upload";

export async function getLectureTitle(text:string){
    const systmePrompt = "You are an model that returns just the title. Example: LECTURE 11: CLASSIFICATION I - DECISION TREES";
    const userPrompt = `Given this lecture snippet what is the lecture title \n\nSnippet: ${text}`;
    const lectureTitle:string = await queryLLM(systmePrompt, userPrompt, {type:ServiceType.AI_GENERATION});
    return lectureTitle;
}

export async function initUpload(paperId:number){
    const result = await createNewUpload(paperId);
    if(!result.upload_id) throw new Error("Database did not return an upload_id");
    const uploadId = result.upload_id;
    const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${uploadId}.pdf`,
    ContentType: "application/pdf",
  });
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  return {uploadId, signedUrl};
}
