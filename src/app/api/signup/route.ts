import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for signup data
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.application_user.create({
      data: {
        username: validated.username,
        email: validated.email,
        password: hashedPassword // Store hashed password
      },
    });

    // Don't send password back in response
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
