import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/services/reset_password";
import { sendResetLink } from "@/lib/services/magicLink";
import z, { safeParse } from "zod";

const emailSchema = z.object({
  email: z.string().email("Invalid email format"),
});
export async function POST(req:NextRequest){
    const body =  await req.json();
    const safe = emailSchema.safeParse(body);
    if(!safe){
        return NextResponse.json({error:safe.error || "Enter valid email"}, {status:400});
    }
    try{
        const rawToken = await createPasswordResetToken(safe.data.email);
        await sendResetLink(safe.data.email, rawToken);
        return NextResponse.json({message:"You should get an email if you are signed up with us."}, {status:200});
    }catch(error){
        console.error(error);
        return NextResponse.json({message:"You should get an email if you are signed up with us."}, {status:200});
    }
    
}