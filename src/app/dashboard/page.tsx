import DashboardClient from "./DashboardClient";
import { getPapersByUserId } from "@/lib/paper";

/** DashboardPage Component
 * @description 
 * Fetches initial papers for the authenticated user and renders the DashboardClient component.
*/
export default async function DashboardPage() {
  const initialPapers = await getPapersByUserId();
  
  return (
    <DashboardClient
      onloadPapers={initialPapers}
    />
  );
}
