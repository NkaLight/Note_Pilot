"use client";

import { request } from "http";
import { useState } from "react";
import LoadingCircles from "./LoadingCircles";

interface ResetPasswordFormProps {
  closeForm: () => void;
}

export default function ResetPasswordForm({closeForm}:ResetPasswordFormProps){
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [output, setOutput] = useState<"You should get an email if you are signed up with us." | null>(null);
    const [error, setError] = useState<string|null>(null);
    console.log(error);
    console.log(output);

    const handleSubmit = async (e:React.FormEvent) =>{
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setOutput(null);
        try{
            const result = await fetch("/api/sendMagicLink", {
                method:"POST", 
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email
                }),
            });
            console.log(result);
            setIsLoading(false);
            setOutput("You should get an email if you are signed up with us.");
            setError(null);
        }catch(error){
            setError("Failed to send the email try again");
            setIsLoading(false);
            setOutput(null);
        }
    };

    return(
         <div className="sign-up-container">
            <h3>Reset password</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="yourEmail@example.com"
                    />
                </div>
                <div className="flex">
                    <button
                        type="submit"
                        className={"w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"}
                        >
                        {isLoading ? <span className="text-white inline-flex items-center gap-2">
                                        <span className="animate-pulse">Loading</span>
                                        <LoadingCircles className={"w-6"}/>
                                    </span> :
                        "Submit"}
                    </button>
                </div>
                {output &&( 
                <div className="text-green-900">
                    {output}
                </div>)}
                {error &&( 
                <div className="text-red-900">
                    {error}
                </div>)}
            </form>
         </div>
    );
}