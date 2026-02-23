import { prisma } from "@/lib/db";
import { DbError } from "../error";

export async function getSummaries(uploadId:number, user_id:number){
    try{
        return await prisma.summary.findMany({
            where:{
                upload_id:uploadId,
                upload:{
                    paper:{
                        user_id:user_id,
                    }
                }
            }
        });
    }catch(error){
        console.error("Database Error in getSummaries:", error);
        throw new DbError("Error fetching summaries");
    }
}