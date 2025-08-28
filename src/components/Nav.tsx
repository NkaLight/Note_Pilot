"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import SignInForm from "@/components/SignInForm";
import Modal from "@/components/Modal"; // reusable modal from earlier
import { useSession } from "@/context/SessionContext";

export default function Nav({ showAuth = true }: { showAuth?: boolean }) {
    const [activeForm, setActiveForm] = useState<"signin" | "signup" | null>(null);
    const [mounted, setMounted] = useState(false)

    const {user} = useSession();

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
                // Update session state to null
                // Maybe redirect to home page
                alert("Logged out successfully")

            } else {
                alert("Failed to log out.");
            }
        } catch (error) {
            console.error(error);
        }
    };


  // Don’t render modal content on server
  if (!mounted) return (
        <nav className="nav-container">
        <div>NOTE_PILOT LOGO</div>
        <div className="nav-links-container">
        <Link href="/ai/dashboard">Dashboard</Link>
            <a href="">About us</a>
            <a href="">Pricing</a>
        </div>
        </nav>
    );
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
                            <div>NOTE_PILOT LOGO</div>
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
                            <SignInForm />
                        </Modal>
                    </>
                )
            }
        </>
    );
}

