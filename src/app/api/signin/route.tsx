import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { z } from "zod";  

// Define a schema for validating incoming login data
const signInSchema = z.object({
  email: z.string().email(),   // Email must be a valid email format
  password: z.string().min(8), // Password must be at least 8 characters
});

export async function POST(request: Request) {
    
  try {
    const body = await request.json();

    // Validate the input against our schema
    const parsed = signInSchema.parse(body);


    const user = await prisma.application_user.findUnique({

        where: {
            email: parsed.email
        },
    })
    if(!user || user.password !== parsed.password){
        throw new Error("Invalid credentials");
    }
    if(user){
        console.log(user)
        return NextResponse.json({ user });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
