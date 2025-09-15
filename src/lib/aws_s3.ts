import AWS from 'aws-sdk';
import { createReadStream } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Initialise the s3 client
export function initialiseS3() {
    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

    const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
    return {s3, BUCKET_NAME}
}

// Create a placeholder object for the user folder
export async function createUserFolder(userId: string, s3: AWS.S3, bucketName: string) {
    const folderKey = `${userId}/`;
    await s3.putObject({
        Bucket: bucketName,
        Key: folderKey,
    }).promise();
    return folderKey;
}

// Upload a file to the user folder
export async function uploadUserFile(userId: string, filePath: string, fileName: string, s3: AWS.S3, bucketName: string ) {
    const fileKey = `${userId}/${fileName}`;
    
    const upload = {
        Bucket: bucketName,
        Key: fileKey,
        Body: createReadStream(filePath),
        ACL: 'private'
    };

    const data = await s3.upload(upload).promise();
    return data.Key; 
}

// List files in user's folder
export async function getUserFiles(userId: string, s3: AWS.S3, bucketName: string) {
    const toList = {
        Bucket: bucketName,
        Prefix: `${userId}/`
    };

    const data = await s3.listObjectsV2(toList).promise();
    return data.Contents;
}

/*
(async () => {
    try {

        const {s3, BUCKET_NAME} = initialiseS3();
        const userId = '666';

        // Create folder
        const folderKey = await createUserFolder(userId, s3, BUCKET_NAME);
        console.log(`Folder created successfully! Key: ${folderKey}`);

        // Upload file
        const fileKey = await uploadUserFile(userId, './test.txt', 'test.txt', s3, BUCKET_NAME);
        console.log(`File uploaded successfully! Key: ${fileKey}`);

        // List files
        const files = await getUserFiles(userId, s3, BUCKET_NAME);
        console.log('Files in user folder:', files);

    } catch (err) {
        console.error('Error:', err);
    }
})();
*/
