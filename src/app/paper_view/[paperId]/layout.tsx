import { getLecturesForPaper } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import ClientProviderWrapper from "./ClientProviderWrapper";
import { redirect } from "next/navigation";

type PaperViewLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ paperId: string }>;
};


export default async function PaperViewLayout({ children, params }: PaperViewLayoutProps) {
    const resolvedParams = await params;
    const user = await getSessionUser();
      console.error(user);
      if(!user){
        redirect("/");
      }
    const paper_id = Number(resolvedParams.paperId);
    const initialLectures = await getLecturesForPaper(paper_id); //I validate when calling the API for the lectures.

    return (
        <ClientProviderWrapper initialLectures={initialLectures}>
            <main>{children}</main>
        </ClientProviderWrapper>
    );
}