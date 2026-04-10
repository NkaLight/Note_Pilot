import { useEffect, useState } from "react";

export default function ProblemSet({ question, index, onAnswerChange }) {
  const [answer, setAnswer] = useState(question.userAnswer || "");
  const [loading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);

  // Update answer when question changes (for persistence)
  useEffect(() => {
    setAnswer(question.userAnswer || "");
  }, [question.userAnswer]);

  // Handle answer changes
  const handleAnswerChange = (newAnswer) => {
    setAnswer(newAnswer);
    if (onAnswerChange) {
      onAnswerChange(newAnswer);
    }
  };

  const getFeedback = async () => {
    if (!answer.trim()) {
      setFeedback("Please provide an answer before requesting feedback.");
      return;
    }

    setIsLoading(true);
    setFeedback("");
    setScore(null);

    try {
      const res = await fetch("/api/problemsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "evaluate",
          userAnswer: answer,
          questions: {
            question: question.question,
            answer: question.answer,
          },
        }),
      });
      if(!res.ok || !res.body) throw new Error("Stream failed please try again");
      const reader = res.body.getReader();
      const textCoder = new TextDecoder();
      let accumulated = '';

      while(true){
        const {done, value} = await reader.read();
        if(done) break;
        const chunk = textCoder.decode(value, {stream:true});
        const lines = chunk.split("\n");
        for(const line of lines){
          if(!line.startsWith("data: ")) continue;
          try{
            const json = JSON.parse(line.slice(6));
            if(json.type === "delta"){
              accumulated += json.text;
              setFeedback(accumulated);
            }
          }catch{
            //do nothing incomplete chunk.
          }
        }
      }
      try{
        const parsed = JSON.parse(accumulated);
        setFeedback(parsed.feedback);
        setScore(parsed.score);
      }catch{
        //response was not JSON so leave as is.
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      setFeedback("Failed to get feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      key={index}
      className="bg-white/70 p-4 rounded-xl shadow-md border border-gray-200"
    >
      <h3 className="font-semibold text-lg mb-2 text-gray-800">
        Q{index + 1}. {question.question}
      </h3>
      <textarea
        className="w-full border rounded-md p-2 text-sm text-gray-800 focus:ring focus:ring-blue-200"
        placeholder="Type your answer here..."
        rows={3}
        value={answer}
        onChange={(e) => handleAnswerChange(e.target.value)}
      />
      <div className="flex justify-between items-center mt-2">
        <button
          onClick={getFeedback}
          disabled={loading || !answer.trim()}
          className="text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed border rounded-xl px-4 py-2 transition-colors"
        >
          {loading ? "Generating..." : "Get Feedback"}
        </button>
        {answer.trim() && (
          <span className="text-xs text-gray-500">
            Answer saved automatically
          </span>
        )}
      </div>

      {/* Feedback Section */}
      {loading && !feedback && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-blue-800 text-sm">Generating feedback...</p>
          </div>
        </div>
      )}

      {feedback && (
        <div className="mt-4 space-y-3">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Feedback:</h4>
            <p className="text-gray-700 leading-relaxed">{feedback}</p>
          </div>
          {score !== null && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                <strong>Score: {Math.round(score * 100)}%</strong>
                <span className="ml-2 text-sm">
                  (
                  {score >= 0.8
                    ? "Excellent!"
                    : score >= 0.6
                    ? "Good work!"
                    : "Keep practicing!"}
                  )
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
