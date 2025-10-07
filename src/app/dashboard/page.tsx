import DashboardClient from "./DashboardClient";
import { getPapersByUserId } from "@/lib/paper";

export default async function DashboardPage() {
  const initialPapers = await getPapersByUserId();
  
  return (
    <DashboardClient
      onloadPapers={initialPapers}
    />
  );
}
