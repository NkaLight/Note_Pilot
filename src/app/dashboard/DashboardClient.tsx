// src/app/dashboard/page.tsx
"use client";

import { useContext, useEffect, useState } from "react";
import Upload from "@/components/DashBoard/Upload";
import type {paper} from "@prisma/client";
import { AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import EditIcon from "@/components/EditIcon"
import Link from "next/link";

//Form SubComponents
const AddPaperForm = ({closeForm }: { closeForm: () => void })=>{
  const [name, setName] = useState<string>("")
  const [code, setCode] = useState<string>("")
  const [descr, setDescr] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try{
      const res = await fetch("/api/papers", {
        method: "POST", 
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: JSON.stringify({
          code, 
          name, 
          descr
        })
      })
      if(!res.ok){
        const error = await res.json()
        setIsSubmitting(false)
        setError(error.error);

      }
      const data = await res.json()

      if(data.status == 200){
        setIsSubmitting(false)
        closeForm()
       
      }
    }catch(error){
      setError("Unexpected Server error")
      setIsSubmitting(false)
    }
  }
  return(
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white text-black">
      <h2 className="text-lg font-bold">Add New Paper</h2>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Paper Title" className="w-full p-2 border rounded" required />
      <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paper Code" className="w-full p-2 border rounded" required />
      <textarea value={descr} onChange={(e) => setDescr(e.target.value)} placeholder="Paper Description" className="w-full p-2 border rounded" rows={5} required />
      <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
      {
        error && (<p>{error}</p>)
      }
    </form>
  )
}


//Form SubComponents
const EditPaper = ({closeForm, paperItem }: { closeForm: () => void; paperItem: paper })=>{
  if(paperItem == null){
    closeForm();
    return;
  }

  const [name, setName] = useState<string>(paperItem.name ??"");
  const [code, setCode] = useState<string>(paperItem.code??"")
  const [descr, setDescr] = useState<string>(paperItem.description??"")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

   const handleUpate = async () => {
    setIsSubmitting(true);
    try{
      const res = await fetch("/api/papers", {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code, 
          name, 
          descr,
          paper_id : paperItem.paper_id
        })
      })
      
      if(!res.ok){
        setIsSubmitting(false)
        const errorData = await res.json()
        setError(errorData.error);
      }
      const data = await res.json()
      //Success
      setIsSubmitting(false)
      closeForm();
    }catch(error){
      setError("Unexpected Server error")
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () =>{
    setIsSubmitting(true)
    try{
       const res = await fetch("/api/papers", {
        method: "DELETE",
        headers:{
          "Content-Type": "application/json",

        },
        body: JSON.stringify({
          paper_id: paperItem.paper_id
        })
       })
       const data = await res.json()
       if(!res.ok){
        setError(data.error)
        setIsSubmitting(false)
       }
       if(res.status == 200){
        setIsSubmitting(false)
        closeForm()
       }
    }catch(error){
      setError("Unexpected server error")
      setIsSubmitting(false)
    }
  }

  return(
    <form className="p-4 space-y-4 bg-white text-black">
      <h2 className="text-lg font-bold">Add New Paper</h2>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Paper Title" className="w-full p-2 border rounded" required />
      <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paper Code" className="w-full p-2 border rounded" required />
      <textarea value={descr} onChange={(e) => setDescr(e.target.value)} placeholder="Paper Description" className="w-full p-2 border rounded" rows={5} required />
      <button type="button" onClick={handleUpate} disabled={isSubmitting} className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
        {isSubmitting ? 'Updating...' : 'Update'}
      </button>
      <button type="button" onClick={handleDelete} disabled={isSubmitting} className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400">
        {isSubmitting ? "Deleting..." : "Delete"}
      </button>
      {
        error && (<p>{error}</p>)
      }
    </form>
  )
}

export default function DashboardPage(props:{onloadPapers :paper[] | null}) {
  const [papers, setPapers] = useState<paper[] | null>(props.onloadPapers);
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState<"addPaper" | "confirmRemovePaper" |"editPaper" | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<paper|null>();
  
  async function fetchSummaries() {
    setLoading(true);
    try {
      const res = await fetch("/api/papers", { cache: "no-store" , method:"GET"});
      const data = await res.json();
      setPapers(data?.papers ?? []);
    } finally {
      setLoading(false);
    }
  }
  function handleCloseModal(){
    fetchSummaries(); //Refresh
    setActiveForm(null);
    setSelectedPaper(null);
  }
  useEffect(() =>{
    fetchSummaries()
  }, [])

  function handleSelectPaper(paper:paper){
    setActiveForm("editPaper")
    setSelectedPaper(paper)
  }
  return (
    <div className="space-y-8 mt-16">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Display current papers */}
      <h2>Your Papers</h2>
      <div className="flex p-5 overflow-x-auto" >
        <>
            {
              papers && papers.map(paper =>(
                <Link href={`/paper_view/${paper.paper_id}/summaries`} key={paper.paper_id}>
                  <div className="relative m-4 bg-white text-black p-4 rounded-full w-36 flex-shrink-0 cursor-pointer hover:bg-green">
                    <div className="absolute top-1 right-3 m-0 p-0 cursor-pointer" onClick={(e)=>{e.stopPropagation();e.preventDefault();handleSelectPaper(paper)}}>
                      <EditIcon
                        className="w-5 h-5 text-black-600 hover:text-blue-500 transition duration-1000"
                      />
                    </div>
                    <p>{paper.code}</p>
                  </div>
                </Link>
              ))
            }

        </>
        <div onClick={()=>setActiveForm("addPaper")} className="m-4 bg-white text-black p-4 rounded-full w-30 cursor-pointer flex-shrink-0">
          <p>Add paper +</p>
        </div>
      </div>
      {/* Animate Presence for sign/sign/account up modals */}
            <AnimatePresence mode="wait" initial={false}>
              {activeForm === "addPaper" && (
                  <Modal
                  isOpen={activeForm === "addPaper"}
                  onClose={() => setActiveForm(null)}
                  key={"addPaper"}
              >
                      <AddPaperForm closeForm={handleCloseModal} />
                  </Modal>
              )
              }{
                activeForm === "editPaper" && selectedPaper &&(
                  <Modal
                    isOpen={activeForm === "editPaper"}
                    onClose={() => setActiveForm(null)}
                    key={"editPaper"}
                  >
                    <EditPaper 
                      closeForm={handleCloseModal}
                      paperItem={selectedPaper}
                    />
                  </Modal>
                )
              }
              </AnimatePresence>
    </div>
  );
}
