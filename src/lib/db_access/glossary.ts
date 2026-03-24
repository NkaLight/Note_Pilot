import { prisma } from "@/lib/db";

export async function saveGlossary(uploadId:number, terms:any[]){
    // Wipe existing glossary for this upload (handles regenerate)
    await prisma.glossary.deleteMany({
        where: { upload_id: uploadId }
    });
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
}
export async function getGlossaryList(uploadId:number, userId:number){
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
}