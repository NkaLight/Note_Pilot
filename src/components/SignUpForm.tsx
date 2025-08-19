"use client";
import { useState } from "react";
export default function signUpForm(){

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

    try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        username,
        email,
        password,
        confirmPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Server returned an error
      alert(data.error || "Failed to create user");
      return;
    }

    // Success
    alert("User created successfully!");
    } catch (error) {
    console.error(error);
    alert("Request failed. Please try again.");
  }
};



    return (
        <div className="sign-up-container">
            <h3>Sign Up form</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div style={{display:"inline-block"}}>
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium">
                        First Name
                        </label>
                        <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter your email"
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium">
                        Last Name
                        </label>
                        <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter your email"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="username" className="block text-sm font-medium">
                    Username
                    </label>
                    <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your email"
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
                    className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your password"
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium">
                    Confirm Password
                    </label>
                    <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Confirm your password"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                    Sign Up
                </button>
                </form>
        </div>
    )
}