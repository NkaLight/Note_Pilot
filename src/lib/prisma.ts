import { prisma } from "@/lib/db";
import { getAuthedUserId } from "./auth";


type Lecture = {
  id: number;
  title: string;
  createdAt: Date;
};

export async function getLecturesForPaper(paperId: number): Promise<Lecture[]> {
    const user_id = await getAuthedUserId();
    if(!user_id) return [];
    const data = await prisma.upload.findMany({
                
                where:{
                    paper:{
                        user_id:user_id,
                        paper_id:paperId,
                    }
                },
                orderBy:{
                    uploaded_at:"desc",
                },
                select: {
                  upload_id: true,
                  filename: true,
                  uploaded_at: true,
                },
            })

    console.log(data)
    const list = data.map(item => {
        return {
          id: item.upload_id,
          title: item.filename,
          createdAt: item.uploaded_at
        };
      });

    return list;
}

export async function getLectureConentById(id: string) {
    try {
        const user_id = await getAuthedUserId();
        console.log(`Authentication check - User ID: ${user_id}`);
        if (!user_id) {
            console.log("No authenticated user found");
            return null;
        }
        
        const uploadId = Number(id);
        console.log(`Searching for upload_id: ${uploadId} for user: ${user_id}`);
        
        // First, let's check if the upload exists at all
        const uploadExists = await prisma.upload.findUnique({
            where: { upload_id: uploadId },
            include: { paper: true }
        });
        console.log("Upload exists:", uploadExists ? `Yes (paper user: ${uploadExists.paper.user_id})` : "No");
        
        const textContent = await prisma.upload.findFirst({
            where: {
                paper: {
                    user_id: user_id
                },
                upload_id: uploadId,
            }
        });
        
        console.log("Found upload:", textContent ? `Yes (${textContent.filename})` : "No");
        console.log("Text content length:", textContent?.text_content?.length || 0);
        
        return textContent?.text_content || null;
    } catch (error) {
        console.error("Error in getLectureConentById:", error);
        return null;
    }
};
