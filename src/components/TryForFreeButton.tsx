"use client";
//A bit of a hack to get access of client-side AuthContext to setActiveForm from Landing page.

import { useAuthContext } from "@/context/AuthContext";

export default function Button(){
    const {setActiveForm} = useAuthContext();

    function handleTryForFree():void{
        setActiveForm("signUp");
    }

    return (
        <button
            onClick={handleTryForFree}
            className="inline-block bg-blue-600 text-white font-semibold rounded-full px-6 py-3 sm:px-8 sm:py-4 hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            🚀 Try for free
        </button>
    );
}