import { useSession } from "@/context/SessionContext";
import { PrismaClient } from "@prisma/client";
import { getAuthedUserId } from "./auth";
import { prisma } from "@/lib/db";


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

export async function getLectureConentById(id:string){
    const user_id = await getAuthedUserId();
    if (!user_id) return null;
    const uploeadId = Number(id);
    const textContent = await prisma.upload.findFirst({
        where:{
            paper:{
              user_id: user_id
            },
            upload_id: uploeadId,
        }
    })
    return textContent.text_content;
};
