'use client';

import SignUpForm from "@/components/SignUpForm";

export default function SignUp() {
  const handleCloseForm = () => {
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to NotePilot</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 sm:px-10">
          <SignUpForm closeForm={handleCloseForm} />
        </div>
      </div>
    </div>
  );
}
