// src/app/components/Dashboard/Summary.tsx
type SummaryType = {
  summaryText: string;
};

type SummaryProps = {
  summary?: SummaryType;
};

export default function Summary({ summary }: SummaryProps) {
  if (!summary) {
    return (
      <div className="p-4 text-gray-500">
        No summary yet.
      </div>
    );
  }

  return (
    <article className="flex-1 border rounded-3xl p-2 bg-white overflow-y-auto space-y-3">
      
    </article>
  );
}
