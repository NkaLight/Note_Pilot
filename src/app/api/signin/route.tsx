import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * API route for user sign-in.
 * Validate user credentials and create a session.
 */

// Define a schema using Zod for validating incoming login data
const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
});

/**
 * This function handles user sign-in.
 * @param request the request object containing email and password.
 * @returns the user object in JSON format.
 */
export async function POST(request: Request) {
    
  try {
    // Validate input data
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);

    if(!parsed.success){
          return NextResponse.json(
            { errors: parsed.error.flatten().fieldErrors },
            { status: 400 }
          ); 
        }
    const data = parsed.data
    // Find user by email
    const user = await prisma.application_user.findUnique({
        where: {
            email: data.email
        },
    });

    // Use constant-time comparison through bcrypt
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate and store session storage in DB
    const token = crypto.randomBytes(32).toString("hex");

    // Store session in DB
    await prisma.session.create({
      data: {
        user_id: user.user_id,
        token,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 1), // 1h
        last_active_at: new Date(),
      },
    });

    // Set cookies
    (await cookies()).set({
      name: "session_token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return NextResponse.json({ user: { id: user.user_id, email: user.email, usernane : user.username } });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
