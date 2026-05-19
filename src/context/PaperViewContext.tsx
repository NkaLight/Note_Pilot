"use client";

import React, { createContext, ReactNode, useContext, useState, useEffect, SetStateAction } from "react";

export type Lecture = {
  id: number;
  title: string;
  createdAt: Date;
};
export type Message = { 
  role: "user" | "assistant"; 
  content: string;
  created_at?: string;
};

type PaperViewContextType = {
  // New state for this context
  paperId:number;
  setPaperId:React.Dispatch<React.SetStateAction<number|null>>;
  lectures: Lecture[];
  setLectures: React.Dispatch<React.SetStateAction<Lecture[]>>;
  chosenLectureId: number | null;
  setChosenLectureId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedLectureIds: number[];
  setSelectedLectureIds: React.Dispatch<React.SetStateAction<number[]>>;
  chatMessages: Message[];
  setChatMessages: (messages: Message[]) => void;
  setCode:(code:string)=>void;
  code:string, 
}

const PaperViewContext = createContext<PaperViewContextType>({
  paperId: null, 
  setPaperId:()=>{},
  lectures: [],
  setLectures: () => {},
  chosenLectureId: null,
  setChosenLectureId: () => {},
  selectedLectureIds: [],
  setSelectedLectureIds: () => {},
  chatMessages:null,
  setChatMessages:()=>{},
  setCode:()=>{},
  code:null
});

export const usePaperViewContext = ()=> useContext(PaperViewContext);

export const PaperViewProvider = ({
    children, 
    initialLectures,
    initialPaperId,
    paperCode 
}: { 
    children: ReactNode;
    initialLectures: Lecture[];
    initialPaperId:number;
    paperCode:string;
}) => {
  const [code, setCode] = useState<string>(paperCode);
  const [lectures, setLectures] = useState<Lecture[]>(initialLectures);
  const [paperId, setPaperId] = useState<number>(initialPaperId);
  const [chosenLectureId, setChosenLectureId] = useState<number | null>(null);
  const [selectedLectureIds, setSelectedLectureIds] = useState<number[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]|null>(null);

  useEffect(() => {
  setChatMessages([]);
}, [chosenLectureId]);

  return (
    <PaperViewContext.Provider 
      value={{ 
        paperId, 
        setPaperId,
        lectures, 
        setLectures, 
        chosenLectureId, 
        setChosenLectureId,
        selectedLectureIds,
        setSelectedLectureIds,
        chatMessages,
        setChatMessages,
        code,
        setCode
      }}
    >
      {children}
    </PaperViewContext.Provider>
  );
};