import { prisma } from "@/lib/db";
import { getSessionUser } from "./auth";


type Lecture = {
  id: number;
  title: string;
  createdAt: Date;
};

