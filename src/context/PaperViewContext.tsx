'use client';

import React, { createContext, ReactNode, useContext, useState } from 'react';

export type Lecture = {
  id: number;
  title: string;
  createdAt: Date;
};


type PaperViewContextType = {
  // New state for this context
  lectures: Lecture[];
  setLectures: React.Dispatch<React.SetStateAction<Lecture[]>>;
  chosenLectureId: number | null;
  setChosenLectureId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedLectureIds: number[];
  setSelectedLectureIds: React.Dispatch<React.SetStateAction<number[]>>;
}

const PaperViewContext = createContext<PaperViewContextType>({
  lectures: [],
  setLectures: () => {},
  chosenLectureId: null,
  setChosenLectureId: () => {},
  selectedLectureIds: [],
  setSelectedLectureIds: () => {},
});

export const usePaperViewContext = ()=> useContext(PaperViewContext)


export const PaperViewProvider = ({
    children, 
    initialLectures 
}: { 
    children: ReactNode;
    initialLectures: Lecture[]; 
}) => {
  const [lectures, setLectures] = useState<Lecture[]>(initialLectures);
  const [chosenLectureId, setChosenLectureId] = useState<number | null>(null);
  const [selectedLectureIds, setSelectedLectureIds] = useState<number[]>([]);

  return (
    <PaperViewContext.Provider 
      value={{ 
        lectures, 
        setLectures, 
        chosenLectureId, 
        setChosenLectureId,
        selectedLectureIds,
        setSelectedLectureIds
      }}
    >
      {children}
    </PaperViewContext.Provider>
  );
};