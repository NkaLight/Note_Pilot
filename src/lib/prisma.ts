import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

type Lecture = {
  id: number;
  title: string;
  createdAt: Date;
};

export async function getLecturesForPaper(paperId: number): Promise<Lecture[]> {
    // Call prisma later
    return [
        { id: 101, title: 'Lecture 1: Intro to AI', createdAt: new Date() },
        { id: 102, title: 'Lecture 2: Search Algorithms', createdAt: new Date() },
        { id: 103, title: 'Lecture 3: Neural Networks', createdAt: new Date() }
    ]
}
