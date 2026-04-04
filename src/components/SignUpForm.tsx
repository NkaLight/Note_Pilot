"use client";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoadingCircles from "@/components/LoadingCircles";
import { useAuthContext } from "@/context/AuthContext";
import { CheckCircle } from "lucide-react";

// Define the type for the props
interface SignUpFormProps {
  closeForm: () => void;
}

export default function SignUpForm({closeForm}: SignUpFormProps){
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const {setUser} = useSession();
    const router = useRouter();
    const { activeForm, setActiveForm } = useAuthContext();


      const validatePassword = (pwd: string): string[] => {
    const validationErrors: string[] = [];
    
    if (pwd.length < 8) {
      validationErrors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(pwd)) {
      validationErrors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(pwd)) {
      validationErrors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(pwd)) {
      validationErrors.push('One number');
    }
    
    return validationErrors;
  };

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ];

const handleSubmit = async (e: React.FormEvent) =>  {
  e.preventDefault();

  const validationErrors = validatePassword(password);
  if(validationErrors.length > 0){
    setError(validationErrors[0]);
    return;
  }
  if(password !== confirmPassword){
    setError("Passwords do not match");
    return;
  }
  setIsLoading(true);
    try {
    const res = await fetch("/api/signup", {
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
    router.prefetch("/account/setup"); //Maybe some performance gains from perfetching
    if (!res.ok) {
      // Server returned an error
      setIsLoading(false);
      setError(data.error || "Failed to create a user");
      return;
    }

    if(res.ok) {
      setIsLoading(false);
      setUser(data);
      router.push("/account");
      //Implement some UI loading state here.
      closeForm();
    }

    // Success
    } catch (error) {
    console.error(error);
    setError("Unexpected server error");
    setIsLoading(false);
  }
};



    return (
        <div className="sign-up-container">
          <h3>Sign Up</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            {/* Password Requirements */}
            {password && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Password must contain:</p>
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {req.met ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={`text-sm ${req.met ? 'text-green-700' : 'text-gray-600'}`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div>
              <label htmlFor="Confirm Password" className="block text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
            <div className="sign-up-button-container">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition cursor-pointer"
              >
                {isLoading ? <span className="text-white inline-flex items-center gap-2">
                                <span className="animate-pulse">Loading</span>
                                <LoadingCircles className={"w-6"}/>
                              </span> :
                        "Create Account"}
              </button>
            </div>
            {/* Divider */}
            <div className="my-2 flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">Or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <div className="flex gap-3 cursor-pointer" onClick={()=> setActiveForm("forgotPassword")}>
              Forgot Password
            </div>
            {error &&( 
              <div className="text-red-900">
                {`${error}`}
              </div>)
            }
          </form>
        </div>
    );
}