'use client';

import { ReactNode } from "react";
import { PaperViewProvider, Lecture } from "@/context/PaperViewContext";

interface Props {
  children: ReactNode;
  initialLectures: Lecture[];
}

export default function ClientProviderWrapper({ children, initialLectures }: Props) {
  return (
    <PaperViewProvider initialLectures={initialLectures}>
      <div>{children}</div>
    </PaperViewProvider>
  );
}
