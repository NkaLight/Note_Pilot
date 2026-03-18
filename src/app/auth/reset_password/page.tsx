"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams ,useRouter } from "next/navigation";
import LoadingCircles from "@/components/LoadingCircles";
import { useAuthContext } from "@/context/AuthContext";

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

    const [passowrd, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    const handleSubmit = async (e:React.FormEvent) =>{
        setLoading(true);
        setError(null);
        setShowForm(null);
        e.preventDefault();
        try{
            const result = await fetch("/api/reset_password", {
                method:"POST", 
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password:passowrd, 
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
                    <>
                        <div>Reset password</div>
                        <form action="POST" onSubmit={handleSubmit}>
                            <input type="password" name="password" id=""placeholder="Password" value={passowrd} onChange={(e)=> setPassword(e.target.value)}/>
                            <input type="password" name="confirm-password" id=""placeholder="Confirm Password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)}/>
                            <input hidden value={token} name="token"/>
                            <button>RESET</button>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
}