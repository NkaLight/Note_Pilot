// src/app/ai/dashboard/page.tsx
"use client";

import { useContext, useEffect, useState } from "react";
import Upload from "@/components/DashBoard/Upload";
import {paper} from "@prisma/client";
import { AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import EditIcon from "@/components/EditIcon"

console.log('Imported EditIcon:', EditIcon);

//Form SubComponents
const AddPaperForm = ({onClose }: { onClose: () => void })=>{
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
      const data = await res.json()

      if(!data.ok || data.status !== 200){
        setIsSubmitting(false)
        console.log(data)
        console.log(data.error[0])
        setError(data.error[0]);
      }
      if(data.status == 200){
        setIsSubmitting(false)
        console.log(data)
        setError("Response is 200")
       
      }
    }catch(error){
      setError("Unexpected Server error")
      setIsSubmitting(false)

    }
  }
  return(
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
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




export default function DashboardPage() {
  const [papers, setPapers] = useState<paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState<"addPaper" | "confirmRemovePaper" |"editPaper" | null>(null);
 
  
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
    setActiveForm(null);
  }
  useEffect(() =>{
    fetchSummaries()
  }, [])

  return (
    <div className="space-y-8 mt-16">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Display current papers */}
      <h2>Your Papers</h2>
      <div className="flex p-5 overflow-scroll" >
        <>
            {
              papers && papers.map(paper =>(
                  <div className="relative m-4 bg-white text-black p-4 rounded-full w-36">
                    <div className="absolute top-1 right-3 m-0 p-0 cursor-pointer">
                      <EditIcon
                        className="w-5 h-5 text-black-600 hover:text-blue-500 transition duration-1000"
                      />
                    </div>
                    <p>{paper.code}</p>
                  </div>
              ))
            }

        </>
        <div onClick={()=>setActiveForm("addPaper")} className="m-4 bg-white text-black p-4 rounded-full w-30 cursor-pointer">
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
                      <AddPaperForm onClose={handleCloseModal} />
                  </Modal>
              )
              }{
                activeForm === "confirmRemovePaper" &&(
                  <Modal
                    isOpen={activeForm ==="confirmRemovePaper"}
                    onClose={() => setActiveForm(null)}
                    key={"confirmRemovePaper"}
                  >
                    <ConfirmRemovePaper closeForm={handleCloseModal}/>
                  </Modal>
                )
              }{
                activeForm === "editPaper" &&(
                  <Modal
                    isOpen={activeForm === "editPaper"}
                    onClose={() => setActiveForm(null)}
                    key={"editPaper"}
                  >
                    <EditPaper closeForm={handleCloseModal}/>
                  </Modal>
                )
              }
              </AnimatePresence>
    </div>
  );
}
