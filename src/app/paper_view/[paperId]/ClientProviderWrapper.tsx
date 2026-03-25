'use client';

import { ReactNode } from "react";
import { PaperViewProvider, Lecture } from "@/context/PaperViewContext";
import StudyLayout from "@/components/PaperView/StudyLayout";

interface Props {
  children: ReactNode;
  initialLectures: Lecture[];
}

export default function ClientProviderWrapper({ children, initialLectures }: Props) {
  return (
    <PaperViewProvider initialLectures={initialLectures}>
      <StudyLayout>
        {children}
      </StudyLayout>
    </PaperViewProvider>
  );
}
