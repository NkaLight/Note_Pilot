import ClientProviderWrapper from "./ClientProviderWrapper";
import {getLecturesForPaper} from "@/lib/prisma";

type PaperViewLayoutProps = {
  children: React.ReactNode;
  params: any;
};


export default async function PaperViewLayout({ children, params }: PaperViewLayoutProps) {
    const paper_id = Number(params.paperId);
    console.log(paper_id);
    const initialLectures = await getLecturesForPaper(paper_id); //I validate when calling the API for the lectures.

    return (
        <ClientProviderWrapper initialLectures={initialLectures}>
            <main>{children}</main>
        </ClientProviderWrapper>
    );
}