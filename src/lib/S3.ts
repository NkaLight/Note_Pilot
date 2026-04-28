import { S3Client } from "@aws-sdk/client-s3";

// Ensure we don't create multiple clients in development (Hot Reloading)
const globalForS3 = global as unknown as { s3: S3Client };

export const s3Client =
  globalForS3.s3 ||
  new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_ACCESS_KEY_SECRETE!,
    },
  });

if (process.env.NODE_ENV !== "production") globalForS3.s3 = s3Client;