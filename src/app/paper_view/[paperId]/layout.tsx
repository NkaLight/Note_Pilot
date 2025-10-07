import { getSessionUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation"; 
import { prisma } from "@/lib/prisma";
import ThemeInit from "@/components/Account/themeInit";
import { ThemeProviders } from "@/components/Account/themeProvider";
import ClientProviderWrapper from "./ClientProviderWrapper";
import {getLecturesForPaper} from "@/lib/prisma";

async function validatePaperId(id: number) {
    // Example: const paper = await prisma.paper.findUnique({ where: { id } });
    
    const user = await getSessionUser();
    console.log(id);
    if(!user) redirect("/");
    const paper = await prisma.paper.findUnique({
        where: {
            paper_id: id,
            user_id: user.user_id 
        }
    });

    if(!paper) return false;
    return true; // Paper not found
}


export default async function PaperViewLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { paperId: string };
}) {
    const paper_id = parseInt(params.paperId, 10);
    const isValid = await validatePaperId(paper_id); // Run server-side validation
    const initialLectures = await getLecturesForPaper(paper_id);

    if(!isValid){
        return notFound();
    }
    console.log("Layout component");

    return (
        <ClientProviderWrapper initialLectures={initialLectures}>
            <main>{children}</main>
        </ClientProviderWrapper>
    );
}