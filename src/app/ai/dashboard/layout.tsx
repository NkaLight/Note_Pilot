// src/app/ai/dashboard/layout.tsx
import type { ReactNode } from "react";

export default function AIPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav is a client component; importing in a server layout is fine */}
      <main className="container mx-auto max-w-5xl px-4 py-8 flex-1">{children}</main>
    </div>
  );
}
