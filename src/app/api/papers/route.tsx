import { getSessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import z, { date } from "zod";



//GET all the papers tied to the user.
export async function GET(){
    const user = await getSessionUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status : 401});
    try{
        const papers = await prisma.paper.findMany({
        where: {
            user_id: user.user_id
            },
        orderBy:{
            paper_id: 'desc'
        }
        })
        return NextResponse.json({papers});
    }catch(error: any){
        return NextResponse.json( { error:"Internal Server error" }, {status: 500});
    }
}

//Add a new paper tied to the user.

const addPaperSchema = z.object({
  name: z.string(),
  descr: z.string(),
  code: z.string(),
});
export async function POST(req: Request){
    const user = await getSessionUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status : 401});
    
    //Validate input
    const body = await req.json();
    const result = addPaperSchema.safeParse(body)
    if(!result.success){
        return NextResponse.json({error: result.error.flatten().fieldErrors, status: 400})
    }
    const validatedInput = result.data
    if(!validatedInput){
        return NextResponse.json({error: "Internal Server error", status:500})
    }

    try{
        const papers = await prisma.paper.create({
            data:{
                user_id: user.user_id,
                name: validatedInput.name,
                code: validatedInput.code,
                description: validatedInput.descr, 
                }
        
        });
        return NextResponse.json({status:200});
    }catch(error: any){
        return NextResponse.json( { error:"Internal Server error" }, {status: 500});
    }
}

//Update Papers
const updatePaperSchema = z.object({
  name: z.string(),
  descr: z.string(),
  code: z.string(),
  paper_id: z.number()
});
export async function PUT(req: Request){
    const user = await getSessionUser();
    if(!user) return NextResponse.json({error: "Unauthorized"}, {status: 401});

    //ValidateSchema
    const body = await req.json()
    const validate = updatePaperSchema.safeParse(body);
    if(!validate.success){
        return NextResponse.json({error: validate.error.flatten().fieldErrors}, {status: 400})
    }

    const data = validate.data
    if(!data){
        return NextResponse.json({error: "Internal Server Error"}, {status: 500})
    }

    //Finally update the Paper
    try{
        const paper = await prisma.paper.update({
            data: {
                name: data.name,
                code: data.code,
                description: data.descr, 
            },
            where: {
                paper_id: data.paper_id,
                user_id: user.user_id
            }
        });
        return NextResponse.json({status:200})

    }catch(error:any){
        return NextResponse.json({ error:"Internal Server error" }, {status: 500});
    }
}
const deletePaperSchema = z.object({
    paper_id: z.number()
});
export async function DELETE(req: Request){
    const user = await getSessionUser();
    if(!user) return NextResponse.json({error: "Unauthorized"}, {status: 401});

    //Validate input 
    const body = await req.json();
    const validate = deletePaperSchema.safeParse(body);
    if(!validate.success) return NextResponse.json({error: validate.error.flatten().fieldErrors}, {status:500});

    const data = validate.data
    if(!data) return NextResponse.json({error: "Internal server error"}, {status: 500});

    try{
        const dbPaper = await prisma.paper.delete({
            where:{
                paper_id: data.paper_id,
                user_id: user.user_id
            }
        }) 
        return NextResponse.json({status:200})
    }catch(error){
        return NextResponse.json({error: "Error deleting your paper"}, {status: 500});
    }
}