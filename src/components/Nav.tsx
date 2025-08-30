"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import SignInForm from "@/components/SignInForm";
import Modal from "@/components/Modal"; // reusable modal from earlier
import { useSession } from "@/context/SessionContext";
import {useRouter} from "next/navigation"
import Image from "next/image"; // for provider logos



export default function Nav({ showAuth = true }: { showAuth?: boolean }) {
    const [activeForm, setActiveForm] = useState<"signin" | "signup" | null>(null);
    const [mounted, setMounted] = useState(false)
    const router = useRouter();
    // const [user, setUser] = useState(useSession())
    const {user, setUser} = useSession()

    // Only show modals/buttons if the page allows it
    if (!showAuth) return null;
        // Mark when the component is mounted on client
        useEffect(() => {
            setMounted(true);
        }, []);
    
    const handleLogout = async () => {
        try { 
            console.log("Removing session")
            const res = await fetch("/api/remove_session", { method: "GET"});
            if (res.ok) {
                // Update session state to null & redirect home.
                console.log("redirected to home page");
                setUser(null)
                router.push("/")
                
            } else {
                alert("Failed to log out.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    function closeSignInModal(){
        console.log("Updated form to null")
        setActiveForm(null)
        setTimeout(() => {
            router.push("/ai/dashboard");
      }, 500);
    }


    return (
        <>
            {user? (
            
                    <nav className="nav-container">
                        <div>Welcome back {user.username}</div>
                        <div className="nav-links-container" >
                            <a href="">Courses</a>
                            <a href="">Summaries</a>
                        </div>
                        <div className="nav-account-section">
                            <a onClick={handleLogout}>Logout</a>
                            <a href="signUp">Account</a>
                        </div>
                    </nav>
                )
                :(
                    <>
                        <nav className="nav-container">
                            <Image src="/icons/Note_Pilot_logo.svg" alt="Note Pilot Logo" width={48} height={48} className="nav-logo"/>
                            <div className="nav-links-container" >
                                <a href="">About us</a>
                                <a href="">Pricing</a>
                            </div>
                            <div className="nav-account-section">
                                <a onClick={() => setActiveForm("signin")}>Login</a>
                                <a href="signUp">Sign Up</a>
                            </div>
                        </nav>
                        {/* Sign In Modal */}
                        <Modal isOpen={activeForm == "signin"} onClose={() => setActiveForm(null)}>
                            <SignInForm  closeForm={closeSignInModal}/>
                        </Modal>
                    </>
                )
            }
        </>
    );
}

