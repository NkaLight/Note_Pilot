// src/components/StudyGuide/StudyGuideGenerator.tsx
"use client";


type StudyGuideGeneratorProps = {
  paperId: number;
  onGenerate: (title: string, aiLevel?: string) => Promise<void>;
  isGenerating: boolean;
  userAiLevel?: string;
};

export default function StudyGuideGenerator({ 
  paperId, 
  onGenerate, 
  isGenerating, 
  userAiLevel = "intermediate" 
}: StudyGuideGeneratorProps) {

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;
    
    await onGenerate("Study Guide", userAiLevel); // Use default title
  };

  return (
    <div className="border rounded-3xl p-4 bg-white mb-6">
      <h3 className="text-xl font-semibold text-black mb-4">Generate New Study Guide</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Generate Button */}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium text-base rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating Study Guide...</span>
            </div>
          ) : (
            "Generate Study Guide"
          )}
        </button>
      </form>

      {/* Info Text */}
      <p className="text-sm text-gray-600 mt-3 text-center">
        Study guides use your AI level preference from Account Settings and are generated from your uploaded lecture content.
      </p>
    </div>
  );
}