import {useState,useEffect } from "react";

export default function ProblemSet({question, index}){
    const [answer, setAnswer] = useState("");
    const [loading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState(null); 
    const [score, setScore] = useState(null);

    console.log(feedback);
    console.log(score);
    console.log(loading);


    const getFeedback = async ()=>{
        if (!answer.trim()) return;
        setIsLoading(true);
        try{
            const res = await fetch("/api/problemsets", {
            method:"POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify({mode: "evaluate", userAnswer:answer, questions: question})
        });
            const data = await res.json();
            console.log(data)
            console.log(data.feedback[0].feedback)
            setFeedback(data.feedback[0].feedback);
            setScore(data.feedback[0].score);
        }catch(error){
            setFeedback("Failed to get feedback. Please try again.");
        }finally{
            setIsLoading(false);
        }

    };

    return(
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
            onChange={(e)=>setAnswer(e.target.value)}
        />
        <button onClick={getFeedback} className="text-black border rounded-xl p-1.5 mt-0.5 hover:bg-grey cursor-pointer" >
            Get feedback
        </button>
        {loading && (<p className="text-black">Generating feedback</p>)}
        {!loading && feedback && (<p className="text-black">{feedback}</p>)}
        {!loading && score !==null && <p className="text-black">Score: <strong>{score * 100}%</strong></p>}
    </div>
    )
    } 
