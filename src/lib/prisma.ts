import { prisma } from "@/lib/db";
import { getSessionUser } from "./auth";


type Lecture = {
  id: number;
  title: string;
  createdAt: Date;
};

export async function getLecturesForPaper(paperId: number): Promise<Lecture[]> {
    const user = await getSessionUser();
    const user_id = user?.user_id; 
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
            });

    const list = data.map(item => {
        return {
          id: item.upload_id,
          title: item.filename,
          createdAt: item.uploaded_at
        };
      });

    return list;
}
