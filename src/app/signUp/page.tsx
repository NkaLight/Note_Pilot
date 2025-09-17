'use client';

import SignUpForm from "@/components/SignUpForm";
import Image from "next/image";

export default function SignIn() {
  const handleCloseForm = () => {
    // Implement your close form logic here
    // For example, redirect to home page
    window.location.href = '/';
  };

  return (
    <div className="signUpPage-container">
      <div className="signUp-page-content-container">
        <h1>Welcome to note pilot</h1>
        <Image 
          src="/note_pilot_logo.svg" 
          alt="NotePilot Logo" 
          className="sign-up-page-logo"
          width={50} 
          height={50} 
        />
      </div>
      <SignUpForm closeForm={handleCloseForm} />
    </div>
  );
}
