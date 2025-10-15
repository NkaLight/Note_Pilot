// src/components/StudyGuide/StudyGuideCard.tsx
"use client";

import { memo, useCallback, useState } from "react";

export type StudyGuideContent = {
  overview: string;
  keyTopics: Array<{
    title: string;
    description: string;
    keyPoints: string[];
  }>;
  studyTips: string[];
  practiceQuestions: Array<{
    question: string;
    answer: string;
  }>;
  additionalResources: string[];
};

export type StudyGuideType = {
  id: number;
  title: string;
  content: StudyGuideContent;
  ai_level: string;
  created_at: string;
  updated_at: string;
};

type StudyGuideCardProps = {
  studyGuide: StudyGuideType;
  onDelete?: (id: number) => void;
  onEdit?: (studyGuide: StudyGuideType) => void;
};

export default memo(function StudyGuideCard({ studyGuide, onDelete, onEdit }: StudyGuideCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({});

  const toggleAnswer = useCallback((index: number) => {
    setShowAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  const aiLevelDisplay = {
    early: "Child Friendly",
    intermediate: "Student Level", 
    advanced: "Advanced Level"
  };

  return (
    <article className="border rounded-3xl p-4 bg-white hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-lg text-black">{studyGuide.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {aiLevelDisplay[studyGuide.ai_level as keyof typeof aiLevelDisplay] || studyGuide.ai_level}
            </span>
            <time className="text-sm text-gray-500">
              {new Date(studyGuide.created_at).toLocaleDateString()}
            </time>
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(studyGuide)}
              className="text-blue-600 hover:text-blue-800 text-base"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(studyGuide.id)}
              className="text-red-600 hover:text-red-800 text-base"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Overview */}
      <div className="mb-4">
        <h5 className="font-bold text-base text-black mb-2">Overview</h5>
        <p className="text-base text-black bg-white p-3 rounded-lg border">
          {studyGuide.content.overview}
        </p>
      </div>

      {/* Key Topics Preview */}
      <div className="mb-4">
        <h5 className="font-bold text-base text-black mb-2">
          Key Topics ({studyGuide.content.keyTopics.length})
        </h5>
        <div className="space-y-2">
          {studyGuide.content.keyTopics.slice(0, showFullContent ? undefined : 2).map((topic, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border">
              <h6 className="font-bold text-base text-black mb-1">{topic.title}</h6>
              <p className="text-sm text-black mb-2">{topic.description}</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {topic.keyPoints.slice(0, 3).map((point, pointIndex) => (
                  <li key={pointIndex} className="flex items-start gap-1">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {showFullContent && (
        <>
          {/* Study Tips */}
          <div className="mb-4">
            <h5 className="font-bold text-base text-black mb-2">Study Tips</h5>
            <div className="bg-white p-3 rounded-lg border">
              <ul className="text-base text-black space-y-1">
                {studyGuide.content.studyTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Practice Questions */}
          <div className="mb-4">
            <h5 className="font-bold text-base text-black mb-2">
              Practice Questions ({studyGuide.content.practiceQuestions.length})
            </h5>
            <div className="space-y-3">
              {studyGuide.content.practiceQuestions.map((qa, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-base text-black flex-1">
                      <span className="font-medium">Q{index + 1}: </span>
                      {qa.question}
                    </p>
                    <button
                      onClick={() => toggleAnswer(index)}
                      className="text-sm text-blue-600 hover:underline ml-2"
                    >
                      {showAnswers[index] ? "Hide" : "Show"} Answer
                    </button>
                  </div>
                  {showAnswers[index] && (
                    <div className="bg-blue-50 p-2 rounded text-base text-black">
                      <span className="font-medium">Answer: </span>
                      {qa.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Resources */}
          <div className="mb-4">
            <h5 className="font-bold text-base text-black mb-2">Additional Resources</h5>
            <div className="bg-white p-3 rounded-lg border">
              <ul className="text-base text-black space-y-1">
                {studyGuide.content.additionalResources.map((resource, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">📚</span>
                    <span>{resource}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setShowFullContent(!showFullContent)}
        className="w-full mt-3 py-2 text-base text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
      >
        {showFullContent ? "Show Less" : "Show Full Study Guide"}
      </button>
    </article>
  );
});