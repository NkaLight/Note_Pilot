
import { DbError } from "../error";
import { prisma } from "@/lib/db";

export async function saveGlossary(uploadId:number, terms:any[]){
    try{
        return await prisma.glossary.create({
            data: {
                upload_id: uploadId,
                term: {
                    create: terms.map((t) => ({
                        name: t.term,
                        definition: t.definition,
                    })),
                },
            },
            include: {
                term: true,
                upload: {
                    select: {
                        upload_id: true,
                        filename: true,
                        paper: { select: { name: true, code: true } },
                    },
                },
            },
        });
    }catch(error){
        console.error(error);
        throw new DbError("Failed to fetch flashCards from DB");
    }
}
export async function getGlossaryList(uploadId:number, userId:number){
    try{
        const result =  await prisma.term.findMany({
            where:{
                glossary:{
                    upload_id:uploadId,
                    upload:{
                        paper:{
                            user_id:userId
                        }
                    }
                },
            },
            select:{
                name:true, 
                definition:true
            }
        });
        return result.map(({ name, definition }) => ({ term: name, definition }));
    }catch(error){
        console.error(error);
        throw new DbError("Failed to fetch flashCards from DB");
    }
}