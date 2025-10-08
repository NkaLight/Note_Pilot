import ClientProviderWrapper from "./ClientProviderWrapper";
import {getLecturesForPaper} from "@/lib/prisma";


export default async function PaperViewLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { paperId: string };
}) {
    const paper_id = parseInt(params.paperId, 10);
    console.log(paper_id);
    const initialLectures = await getLecturesForPaper(paper_id); //I validate when calling the API for the lectures.

    return (
        <ClientProviderWrapper initialLectures={initialLectures}>
            <main>{children}</main>
        </ClientProviderWrapper>
    );
}