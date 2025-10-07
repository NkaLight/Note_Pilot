'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

const PaperViewContext = createContext<PaperViewContextType>({
  lectures: [],
  setLectures: () => {},
  chosenLectureId: null,
  setChosenLectureId: () => {},
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

  return (
    <PaperViewContext.Provider 
      value={{ 
        lectures, 
        setLectures, 
        chosenLectureId, 
        setChosenLectureId 
      }}
    >
      {children}
    </PaperViewContext.Provider>
  );
};