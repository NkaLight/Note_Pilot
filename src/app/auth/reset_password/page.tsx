"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams ,useRouter } from "next/navigation";
import LoadingCircles from "@/components/LoadingCircles";
import { useAuthContext } from "@/context/AuthContext";
import {Lock, Eye, EyeOff} from "lucide-react";

export default function Verify(){
    const searchParams = useSearchParams();
    const token  = searchParams.get("token");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [output, setOutput] = useState<string|null>(null);
    const [showForm, setShowForm] = useState(false);
    const router = useRouter();
    const hasCalled = useRef(false); 
    const {setActiveForm} = useAuthContext();

    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    const handleSubmit = async (e:React.FormEvent) =>{
        setLoading(true);
        setError(null);
        setShowForm(null);
        e.preventDefault();
        try{
            const result = await fetch("/api/account/reset_password", {
                method:"PUT", 
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password:password, 
                    confirmPassword:confirmPassword,
                    token: token,

                }),
            });
            const data = await result.json();
            if(result.ok){
                setOutput(data.message);
            }else{
                setError(data.error());
            }
        }catch(error){
            console.log("failed");
            setError("Internal server error please try again later.");
        }finally{
            setLoading(false);
        }
    };
    useEffect(()=>{
        if(!token || hasCalled.current){
            setError("Link invalid - resign in");
            setLoading(false);
            return;
        }
        hasCalled.current = true;
        const handleVerfiry = async(tokenFromUrl:string)=>{
            setLoading(true);
            const res = await fetch("/api/verify", {
                method:"POST", 
                headers:{'Content-Type': 'application/json'},
                body: JSON.stringify({ token: tokenFromUrl })
            });
            if(!res.ok){
                console.error(await res.text());
                setError("Link expired please click forgot password again");
            }
            if(res.ok){
                setShowForm(true);
            }
            setLoading(false);
        };
        handleVerfiry(token);
    }, [token, router]);

    return(
        <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                {loading && <span className="text-white inline-flex items-center gap-2">
                                <span className="animate-pulse">Verifying</span>
                                <LoadingCircles className={"w-6"}/>
                            </span> 
                }
                {error && (
                    <>
                        <p className="text-red-500">{error}</p>
                        <p onClick={()=>setActiveForm("forgotPassword")} className="cursor-pointer">Re-send Email</p>
                    </>
                )}
                {output && (
                    <>
                        <p className="text-green-500">{output}</p>
                        <p onClick={()=>setActiveForm("signIn")} className="cursor-pointer">Login</p>
                    </>
                )}
                {showForm && (
                    <div className={"w-full max-w-md bg-grey-950 rounded-2xl shadow-xl p-8"}>
                        <div className="text-center mb-8">
                            <div className="mx-auto w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                                <Lock className={"w-6 text-blue-900"}/>
                            </div>
                            <h1 className="text-3xl font-semibold text-indigo-900 mb-2">RESET PASSWORD</h1>
                             <p className="text-gray-600">
                                Enter your new password below
                            </p>
                            <form action="POST" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? "text":"password"} 
                                            name="password" 
                                            id=""
                                            placeholder="Password" 
                                            value={password} 
                                            className="w-full px-4 py-3 pr-12 fill-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition rounded-2xl"
                                            required
                                            onChange={(e)=> setPassword(e.target.value)}/>
                                        <button
                                            onClick={()=> setShowPassword(!showPassword)}
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5 cursor-pointer" />
                                            ) : (
                                                <Eye className="w-5 h-5 cursor-pointer" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                            placeholder="Confirm Password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-5 h-5 cursor-pointer" />
                                            ) : (
                                                <Eye className="w-5 h-5 cursor-pointer" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <input hidden value={token} name="token"/>
                                <button 
                                    type="submit" 
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg mt-4 cursor-pointer">
                                        RESET
                                    </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}