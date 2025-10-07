import { useSession } from "@/context/SessionContext";
import { PrismaClient } from "@prisma/client";
import { getAuthedUserId } from "./auth";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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
                }
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
