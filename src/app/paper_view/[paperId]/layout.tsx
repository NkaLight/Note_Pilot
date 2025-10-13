import { getLecturesForPaper } from "@/lib/prisma";
import ClientProviderWrapper from "./ClientProviderWrapper";

type PaperViewLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ paperId: string }>;
};


export default async function PaperViewLayout({ children, params }: PaperViewLayoutProps) {
    const resolvedParams = await params;
    const paper_id = Number(resolvedParams.paperId);
    console.log(paper_id);
    const initialLectures = await getLecturesForPaper(paper_id); //I validate when calling the API for the lectures.

    return (
        <ClientProviderWrapper initialLectures={initialLectures}>
            <main>{children}</main>
        </ClientProviderWrapper>
    );
}