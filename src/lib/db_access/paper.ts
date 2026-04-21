import { getSessionUser } from "../auth";
import { prisma } from "@/lib/db";

export async function getPapersByUserId() {
  const {user} = await getSessionUser();
  if (!user.user_id)return null;
  try {
    const papers = await prisma.paper.findMany({
      where: { user_id:user.user_id },
      orderBy: { paper_id: "desc" },
    });
    return papers; 
  } catch (error: any) {
    console.error("Error fetching papers:", error);
    return null;
  }
}

export async function verfiyPaperId(paperId:number, userId:number){
  return await prisma.paper.findFirst({
    select:{
      paper_id:true
    }, 
    where:{
      paper_id: paperId, 
      user_id:userId,
    }
  });
}