import { getLecturesForPaper } from "@/lib/db_access/upload";
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
      if(user.status === "invalid"){
        redirect("/");
      }
    const paper_id = Number(resolvedParams.paperId);
    const initialLectures = user.status === "ok" ? await getLecturesForPaper(paper_id, user.user_id): []; 

    return (
        <ClientProviderWrapper initialLectures={initialLectures}>
            <main>{children}</main>
        </ClientProviderWrapper>
    );
}