import { generateGlossary } from "@/lib/services/glossary";
import { getGlossaryList } from "@/lib/db_access/glossary";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";
import { saveGlossary } from "@/lib/db_access/glossary";

// Request validator
const GlossaryReq = z
    .object({
        uploadId: z.number(),
    })
    .refine((v) => v.uploadId, {
        message: "Missing or invalid input.",
    });

// Expected AI output
const TermArray = z.array(
    z.object({
        term: z.string(),
        definition: z.string(),
    })
);

export async function POST(req: Request) {
    try {
        // Auth check
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Validate request
        const body = await req.json();
        const parsed = GlossaryReq.safeParse(body);
        if (!parsed.success)
            return NextResponse.json({ error: parsed.error.message }, { status: 400 });

        const jsonText = await generateGlossary(parsed.data.uploadId, user.user_id);

        // Validates AI output
        let terms;
        try {
            terms = TermArray.parse(JSON.parse(jsonText));
        } catch {
            return NextResponse.json(
                { error: "LLM did not return valid glossary JSON", detail: terms.slice(0, 800) },
                { status: 502 }
            );
        }

        // Saves to DB
        let savedGlossary = null;
        if (parsed.data.uploadId) {
            savedGlossary = await saveGlossary(parsed.data.uploadId, terms);
        }
        // Returns glossary + linked paper info
        return NextResponse.json({
            glossary: terms,
            savedGlossary,
        });
    } catch (err: any) {
        console.error("Glossary route error:", err);
        return NextResponse.json({ error: "Internal Server error" }, { status: 500 });
    }
}

export async function GET(req:Request){
    const user = await getSessionUser();
    if(!user) return NextResponse.json({error:"Unauthenticated"}, {status:401});
    //Validated request
    const body = await req.json();
    const parsed = GlossaryReq.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    try{
        const terms = await getGlossaryList(parsed.data.uploadId, user.user_id);
        return NextResponse.json({glossary: terms});
    }catch(error){
        console.error(error);
        return NextResponse.json({error:"Internal server erorr"}, {status:500});
    }
}