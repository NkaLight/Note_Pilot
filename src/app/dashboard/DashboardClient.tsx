"use client";

import { useEffect, useState } from "react";
import type { paper } from "@prisma/client";
import { AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import EditIcon from "@/components/EditIcon";
import Link from "next/link";

/* ---------- AddPaperForm Component ---------- */
const AddPaperForm = ({ closeForm }: { closeForm: () => void }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [descr, setDescr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: JSON.stringify({ code, name, descr }),
      });
      if (!res.ok) {
        const error = await res.json();
        setError(error.error);
        setIsSubmitting(false);
        return;
      }
      const data = await res.json();
      if (data.status === 200) {
        setIsSubmitting(false);
        closeForm();
      }
    } catch {
      setError("Unexpected Server error");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white text-black">
      <h2 className="text-lg font-bold">Add New Paper</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Paper Title"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paper Code"
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        value={descr}
        onChange={(e) => setDescr(e.target.value)}
        placeholder="Paper Description"
        className="w-full p-2 border rounded"
        rows={5}
        required
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isSubmitting ? "Saving..." : "Save"}
      </button>
      {error && <p>{error}</p>}
    </form>
  );
};

/* ---------- EditPaper Component ---------- */
const EditPaper = ({
  closeForm,
  paperItem,
}: {
  closeForm: () => void;
  paperItem: paper;
}) => {
  const [name, setName] = useState(paperItem.name ?? "");
  const [code, setCode] = useState(paperItem.code ?? "");
  const [descr, setDescr] = useState(paperItem.description ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/papers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          descr,
          paper_id: paperItem.paper_id,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error);
        setIsSubmitting(false);
        return;
      }
      await res.json();
      setIsSubmitting(false);
      closeForm();
    } catch {
      setError("Unexpected Server error");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/papers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper_id: paperItem.paper_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setIsSubmitting(false);
        return;
      }
      if (res.status === 200) {
        setIsSubmitting(false);
        closeForm();
      }
    } catch {
      setError("Unexpected server error");
      setIsSubmitting(false);
    }
  };

  return (
    <form className="p-4 space-y-4 bg-white text-black">
      <h2 className="text-lg font-bold">Edit Paper</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Paper Title"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paper Code"
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        value={descr}
        onChange={(e) => setDescr(e.target.value)}
        placeholder="Paper Description"
        className="w-full p-2 border rounded"
        rows={5}
        required
      />
      <button
        type="button"
        onClick={handleUpdate}
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isSubmitting ? "Updating..." : "Update"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
      >
        {isSubmitting ? "Deleting..." : "Delete"}
      </button>
      {error && <p>{error}</p>}
    </form>
  );
};

/* ---------- DashboardPage Component ---------- */
export default function DashboardPage(props: { onloadPapers: paper[] | null }) {
  const [papers, setPapers] = useState<paper[] | null>(props.onloadPapers);
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState<
    "addPaper" | "confirmRemovePaper" | "editPaper" | null
  >(null);
  const [selectedPaper, setSelectedPaper] = useState<paper | null>();

  useEffect(() => {
    async function fetchSummaries() {
      setLoading(true);
      try {
        const res = await fetch("/api/papers", {
          cache: "no-store",
          method: "GET",
        });
        const data = await res.json();
        setPapers(data?.papers ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchSummaries();
  }, []);

  const handleCloseModal = () => {
    setActiveForm(null);
    setSelectedPaper(null);
  };

  const handleSelectPaper = (paper: paper) => {
    setActiveForm("editPaper");
    setSelectedPaper(paper);
  };

  const bentoBoxes = [
    {
      title: "Flashcards in Minutes",
      description:
        "Automatically generate flashcards from your notes and boost your recall.",
      icon: "📇",
    },
    {
      title: "Smart Summaries",
      description:
        "Condense lecture notes into concise, AI-generated summaries.",
      icon: "📝",
    },
    {
      title: "Practice Problems",
      description:
        "Generate relevant practice problems to test your understanding.",
      icon: "🧩",
    },
    {
      title: "Glossary Builder",
      description: "Quickly create glossaries of key terms for revision.",
      icon: "📚",
    },
  ];

  return (
    <div className="space-y-8 mt-16">
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
        Dashboard
      </h1>

      {/* Display current papers */}
      <h2 className="mt-10 text-2xl sm:text-2xl md:text-2xl lg:text-5xl font-bold">
        Your Papers
      </h2>
      <div className="flex p-0 overflow-x-auto">
        {papers &&
          papers.map((paper) => (
            <Link href={`/paper_view/${paper.paper_id}/pdfs`} key={paper.paper_id}>
                <div className="relative m-4 bg-white text-black p-4 rounded-full w-36 flex-shrink-0 cursor-pointer hover:bg-blue-700 hover:text-white transition-colors duration-300"><div
                  className="absolute top-1 right-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleSelectPaper(paper);
                  }}
                >
                  <EditIcon className="w-5 h-5 text-black hover:text-blue-500 transition duration-1000" />
                </div>
                <p>{paper.code}</p>
              </div>
            </Link>
          ))}
        <div
          onClick={() => setActiveForm("addPaper")}
          className="m-4 bg-white text-black p-4 rounded-full w-30 cursor-pointer flex-shrink-0"
        >
          <p>Add paper +</p>
        </div>
      </div>

      {/* --- Bento Box Section --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        {bentoBoxes.map((box, index) => (
          <div
            key={index}
            className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="text-4xl mb-4">{box.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{box.title}</h3>
            <p className="text-gray-200 text-sm">{box.description}</p>
          </div>
        ))}
      </div>

      {/* AnimatePresence for modals */}
      <AnimatePresence mode="wait" initial={false}>
        {activeForm === "addPaper" && (
          <Modal
            isOpen={activeForm === "addPaper"}
            onClose={() => setActiveForm(null)}
            key={"addPaper"}
          >
            <AddPaperForm closeForm={handleCloseModal} />
          </Modal>
        )}
        {activeForm === "editPaper" && selectedPaper && (
          <Modal
            isOpen={activeForm === "editPaper"}
            onClose={() => setActiveForm(null)}
            key={"editPaper"}
          >
            <EditPaper closeForm={handleCloseModal} paperItem={selectedPaper} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
