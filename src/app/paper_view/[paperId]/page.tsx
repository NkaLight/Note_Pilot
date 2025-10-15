"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Default page for paper_view/[paperId]
 * Automatically redirects to the PDFs page for better UX
 */
export default function PaperViewDefaultPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params?.paperId;

  useEffect(() => {
    if (paperId) {
      // Redirect to PDFs page as the default landing page for a paper
      router.replace(`/paper_view/${paperId}/pdfs`);
    }
  }, [paperId, router]);

  // Show a loading state while redirecting
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading paper...</p>
      </div>
    </div>
  );
}
