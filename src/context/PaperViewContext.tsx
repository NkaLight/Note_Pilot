"use client";

import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";

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
  paperId:number, 
  setPaperId:(id:number)=>void;
}

const PaperViewContext = createContext<PaperViewContextType>({
  lectures: [],
  setLectures: () => {},
  chosenLectureId: null,
  setChosenLectureId: () => {},
  selectedLectureIds: [],
  setSelectedLectureIds: () => {},
  chatMessages:null,
  setChatMessages:()=>{},
  setCode:()=>{},
  code:null,
  paperId:null, 
  setPaperId:()=>{}
});

export const usePaperViewContext = ()=> useContext(PaperViewContext);

export const PaperViewProvider = ({
    children, 
    initialLectures,
    paperCode,
    initialPaperId
}: { 
    children: ReactNode;
    initialLectures: Lecture[];
    paperCode:string;
    initialPaperId:number;
}) => {
  const [code, setCode] = useState<string>(paperCode);
  const [lectures, setLectures] = useState<Lecture[]>(initialLectures);
  const [chosenLectureId, setChosenLectureId] = useState<number | null>(null);
  const [selectedLectureIds, setSelectedLectureIds] = useState<number[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]|null>(null);
  const [paperId, setPaperId] = useState<number>(initialPaperId);

  useEffect(() => {
  setChatMessages([]);
}, [chosenLectureId]);

  return (
    <PaperViewContext.Provider 
      value={{ 
        lectures, 
        setLectures, 
        chosenLectureId, 
        setChosenLectureId,
        selectedLectureIds,
        setSelectedLectureIds,
        chatMessages,
        setChatMessages,
        code,
        setCode,
        paperId,
        setPaperId
      }}
    >
      {children}
    </PaperViewContext.Provider>
  );
};