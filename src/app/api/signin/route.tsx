import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// Define a schema for validating incoming login data
const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
    
  try {
    // Validate input data
    const body = await request.json();
    const parsed = signInSchema.parse(body);

    // Find user by email
    const user = await prisma.application_user.findUnique({
        where: {
            email: parsed.email
        },
    });

    // Use constant-time comparison through bcrypt
    if (!user || !(await bcrypt.compare(parsed.password, user.password))) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
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
    return NextResponse.json({ user: { id: user.username, email: user.email } });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
