"use client";
import { useState } from "react";
import Image from "next/image"; // for provider logos
import { useSession } from "@/context/SessionContext";

// Define the type for the props
interface SignInFormProps {
  closeForm: () => void;
}

export default function SignInForm({closeForm}: SignInFormProps){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const {setUser} = useSession()



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

    try {
    const res = await fetch("/api/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Server returned an error
      alert(data.error || "Failed to sign in");
      return;
    }

    // Success
    setUser(data)
    closeForm()
    
    
    } catch (error) {
    console.error(error);
    alert("Request failed. Please try again.");
  }
};

    return (
        <div className="sign-in-container">
            <h3>Sign In</h3>
             <form className="space-y-4" onSubmit={handleSubmit}>
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
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                    Sign In
                </button>
                {/* Divider */}
                <div className="my-2 flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-3 text-sm text-gray-500">or continue with</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
    
                {/* OAuth Buttons */}
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
            </form>
        </div>
    )
}