// src/app/components/Dashboard/Summary.tsx
export default function Summary({
    summary,
  }: {
    summary: { id: string; title: string | null; summaryText: string; createdAt: string };
  }) {
    return (
      <article className="border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{summary.title ?? "Untitled"}</h4>
          <time className="text-xs text-black-500">
            {new Date(summary.createdAt).toLocaleString()}
          </time>
        </div>
        <p className="text-sm text-black-700 line-clamp-6 whitespace-pre-wrap">
          {summary.summaryText}
        </p>
      </article>
    );
  }
  