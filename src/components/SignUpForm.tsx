"use client";
import Image from "next/image"; // for provider logos
import { useState } from "react";
import { unknown } from "zod";

// Define the type for the props
interface SignUpFormProps {
  closeForm: () => void;
}


export default function SignUpForm({closeForm}: SignUpFormProps){

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true)
    try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      // Server returned an error
      setIsLoading(false)
      setError(data.error || "Failed to create a user")
      return;
    }

    if(res.ok) {
      setIsLoading(false)
      closeForm();
    }

    // Success
    } catch (error) {
    console.error(error);
    setError("Unexpected server error")
    setIsLoading(false)
  }
};



    return (
        <div className="sign-up-container">
          <h3>Sign Up</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a username"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
            <div className="sign-up-button-container">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition cursor-pointer"
              >
                {isLoading ? <span className=" text-white justify-self-center items-center gap-2">
                                        <span className="animate-pulse">Loading</span>
                                        <span className="animate-bounce">.</span>
                                        <span className="animate-bounce delay-150">.</span>
                                        <span className="animate-bounce delay-300">.</span>
                                    </span> :
                        "Create Account"}
              </button>
            </div>
            {/* Divider */}
            <div className="my-2 flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">or continue with</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => alert("Google auth not implemented yet")}
                className="flex-1 flex items-center justify-center cursor-pointer"
              >
                <Image src="/icons/icons8-google.svg" alt="Google" width={32} height={32} />
              </button>

              <button
                type="button"
                onClick={() => alert("Apple auth not implemented yet")}
                className="flex-1 flex items-center justify-center cursor-pointer"
              >
                <Image src="/icons/icons8-apple-inc.svg" alt="Apple" width={32} height={32} />
              </button>
            </div>
            {error &&( 
              <div className="text-red-900">
                {`${error}`}
              </div>)
            }
          </form>
        </div>
    )
}