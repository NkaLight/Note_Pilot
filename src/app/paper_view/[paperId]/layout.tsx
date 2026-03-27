import { getLecturesForPaper } from "@/lib/db_access/upload";
import { getSessionUser } from "@/lib/auth";
import ClientProviderWrapper from "./ClientProviderWrapper";
import { redirect } from "next/navigation";

type PaperViewLayoutProps = {
  children: React.ReactNode;
  params: { paperId: string};
};

export default async function PaperViewLayout({ children, params, }: PaperViewLayoutProps) {
    const { paperId } = params;
    const {user, status} = await getSessionUser();
      if(status === "invalid"){
        //redirect("/");
      }
    const paper_id = Number(paperId);
    const initialLectures = status === "ok" ? await getLecturesForPaper(paper_id, user.user_id): []; 

    return (
        <ClientProviderWrapper initialLectures={initialLectures}>
            {children}
        </ClientProviderWrapper>
    );
}