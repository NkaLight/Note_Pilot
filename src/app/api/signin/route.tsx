import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma"; 
import { z } from "zod";  

// Define a schema for validating incoming login data
const signInSchema = z.object({
  email: z.string().email(),   // Email must be a valid email format
  password: z.string(), // Password must be at least 8 characters
});

export async function POST(request: Request) {
    
  try {
    //Find the valid user and validate password with input
    const body = await request.json();
    const parsed = signInSchema.parse(body); // Validate the input against our schema
    const user = await prisma.application_user.findUnique({
        where: {
            email: parsed.email
        },
    })
    if(!user || user.password !== parsed.password){
        throw new Error(`Invalid credentials ${user}`);
    }

    //Generate and store session storage in DB
    const token = crypto.randomBytes(32).toString("hex");

    // store session in DB
    await prisma.session.create({
      data: {
        user_id: user.user_id,
        token,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 1), // 1h
        last_active_at: new Date(),
      },
    });

    // set cookie
    (await cookies()).set({
      name: "session_token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return NextResponse.json({ user: { id: user.user_id, email: user.email } });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
