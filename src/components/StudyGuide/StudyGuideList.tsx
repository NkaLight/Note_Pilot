// src/components/StudyGuide/StudyGuideList.tsx
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

// Lazy load heavy components
const StudyGuideCard = dynamic(() => import("./StudyGuideCard"), {
  loading: () => <div className="border rounded-2xl p-4 bg-gray-50 dark:bg-gray-800 animate-pulse h-64"></div>
});
const StudyGuideGenerator = dynamic(() => import("./StudyGuideGenerator"), {
  loading: () => <div className="border rounded-2xl p-4 bg-white dark:bg-gray-800 mb-6 animate-pulse h-32"></div>
});

import { StudyGuideType } from "./StudyGuideCard";

type StudyGuideListProps = {
  paperId: number;
  userAiLevel?: string;
};

export default function StudyGuideList({ paperId, userAiLevel = "intermediate" }: StudyGuideListProps) {
  const [studyGuides, setStudyGuides] = useState<StudyGuideType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Memoize expensive mapping
  const dbLevel = useMemo(() => {
    const uiToDbLevel: Record<string, string> = {
      child: "early",
      student: "intermediate", 
      advanced: "advanced",
    };
    return uiToDbLevel[userAiLevel] || "intermediate";
  }, [userAiLevel]);

  // Optimized fetch with caching
  const fetchStudyGuides = useCallback(async () => {
    try {
      setLoading(true);
      
      // Add cache headers for better performance
      const response = await fetch(`/api/studyguides?paperId=${paperId}`, {
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes cache
        },
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch study guides");
      }

      // Optimize JSON parsing - only parse if needed
      const studyGuidesWithParsedContent = data.studyGuides.map((sg: any) => ({
        ...sg,
        content: typeof sg.content === "string" ? JSON.parse(sg.content) : sg.content,
      }));

      setStudyGuides(studyGuidesWithParsedContent);
    } catch (err: any) {
      console.error("Error fetching study guides:", err);
      setError(err.message || "Failed to load study guides");
    } finally {
      setLoading(false);
    }
  }, [paperId]);

  // Debounced auto-generation to prevent multiple calls
  const autoGenerateStudyGuide = useCallback(async () => {
    if (studyGuides.length === 0 && !isGenerating) {
      try {
        await handleGenerate("Introduction Study Guide", dbLevel);
      } catch (err) {
        console.error("Auto-generation failed:", err);
      }
    }
  }, [studyGuides.length, isGenerating, dbLevel]);

  // Generate new study guide
  const handleGenerate = async (title: string, aiLevel: string = dbLevel) => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch("/api/studyguides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId,
          title,
          aiLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate study guide");
      }

      // Add new study guide to list
      setStudyGuides(prev => [data.studyGuide, ...prev]);
    } catch (err: any) {
      console.error("Error generating study guide:", err);
      setError(err.message || "Failed to generate study guide");
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete study guide
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this study guide?")) return;

    try {
      const response = await fetch(`/api/studyguides?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete study guide");
      }

      setStudyGuides(prev => prev.filter(sg => sg.id !== id));
    } catch (err: any) {
      console.error("Error deleting study guide:", err);
      alert(err.message || "Failed to delete study guide");
    }
  };

  // Initialize data with dependency optimization
  useEffect(() => {
    fetchStudyGuides();
  }, [fetchStudyGuides]);

  // Auto-generate with proper dependency management
  useEffect(() => {
    if (!loading && studyGuides.length === 0) {
      // Add small delay to prevent race conditions
      const timeoutId = setTimeout(() => {
        autoGenerateStudyGuide();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, studyGuides.length, autoGenerateStudyGuide]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-black text-base">Loading study guides...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generator */}
      <StudyGuideGenerator
        paperId={paperId}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        userAiLevel={userAiLevel}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700 text-base">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 text-base hover:underline mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Study Guides Grid */}
      {studyGuides.length > 0 ? (
        <div className="grid gap-6">
          {studyGuides.map((studyGuide) => (
            <StudyGuideCard
              key={studyGuide.id}
              studyGuide={studyGuide}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : !isGenerating && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">📚</div>
            <p className="text-lg text-black">No study guides yet</p>
            <p className="text-base text-gray-600">Create your first study guide using the form above</p>
          </div>
        </div>
      )}

      {/* Generation Status */}
      {isGenerating && studyGuides.length === 0 && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-black">
              <p className="font-medium text-lg">Generating your study guide...</p>
              <p className="text-base text-gray-600">This may take a few moments</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}