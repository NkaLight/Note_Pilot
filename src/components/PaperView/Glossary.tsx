// src/app/components/Dashboard/Summary.tsx
type SummaryType = {
    id: string;
    title: string | null;
    summaryText: string;
    createdAt: string;
  };
  
  type SummaryProps = {
    summary?: SummaryType;
  };
  
  export default function Summary({ summary }: SummaryProps) {
    if (!summary) {
      return (
        <div className="p-4 text-gray-500">
          No summary selected yet.
        </div>
      );
    }
  
    return (
      <article className="border rounded-2xl p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{summary.title ?? "Untitled"}</h4>
          <time className="text-xs text-gray-500">
            {new Date(summary.createdAt).toLocaleString()}
          </time>
        </div>
        <p className="text-sm text-gray-700 line-clamp-6 whitespace-pre-wrap">
          {summary.summaryText}
        </p>
      </article>
    );
  }
  