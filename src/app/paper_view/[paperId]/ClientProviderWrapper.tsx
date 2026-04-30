"use client";

import { ReactNode } from "react";
import { PaperViewProvider, Lecture } from "@/context/PaperViewContext";
import StudyLayout from "@/components/PaperView/StudyLayout";

interface Props {
  children: ReactNode;
  initialLectures: Lecture[];
  initialPaperId:number;
}

export default function ClientProviderWrapper({ children, initialLectures, initialPaperId }: Props) {
  return (
    <PaperViewProvider initialLectures={initialLectures} paperCode={null} initialPaperId={initialPaperId}>
      <StudyLayout>
        {children}
      </StudyLayout>
    </PaperViewProvider>
  );
}
