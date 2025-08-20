import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.password !== body.confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const user = await prisma.application_user.create({
      data: {
        username: body.username,
        email: body.email,
        password: body.password
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// user_id            Int                  @id @default(autoincrement())
//   username           String               @unique @db.VarChar(20)
//   password           String
//   email              String               @unique @db.VarChar(255)
//   date_of_creation   DateTime?            @default(now()) @db.Timestamp(6)
//   paper              paper[]
//   preferences        preferences?
//   session            session[]
//   twofactorauthtoken twofactorauthtoken[]