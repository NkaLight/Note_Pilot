"use client";

import { useEffect, useState } from "react";
import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";
import Modal from "@/components/Modal"; // reusable modal from earlier

export default function Nav({ showAuth = true }: { showAuth?: boolean }) {
    const [activeForm, setActiveForm] = useState<"signin" | "signup" | null>(null);
    const [mounted, setMounted] = useState(false)

    // Only show modals/buttons if the page allows it
    if (!showAuth) return null;
        // Mark when the component is mounted on client
        useEffect(() => {
            setMounted(true);
        }, []);

  // Don’t render modal content on server
  if (!mounted) return (
        <nav className="nav-container">
        <div>NOTE_PILOT LOGO</div>
        <div className="nav-links-container">
            <a href="">Dashboard</a>
            <a href="">About us</a>
            <a href="">Pricing</a>
        </div>
        </nav>
    );
    return (
        <>
            <nav className="nav-container">
                <div>NOTE_PILOT LOGO</div>
                <div className="nav-links-container" >
                    <a href="">Dashboard</a>
                    <a href="">About use</a>
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
    );
}

