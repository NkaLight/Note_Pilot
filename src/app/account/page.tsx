"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSession } from "@/context/SessionContext";
import ProfileFields from "@/components/Account/profileFields";
import Preferences from "@/components/Account/preferences";
import Avatar from "@/components/Account/avatar";

type AILevel = "child" | "student" | "advanced"; // Define the level at which the AI should operate for the user

/**
 * AccountPage Component
 * @description 
 * Client side component that renders the account "window" (profile fields, preferences, avatar).
 * Hydrates initial values from SessionContext and keeps session in sync after updates.
 * Submits to /api/account (supports JSON and multipart for avatar upload).
 * Sends current theme choice (next-themes) so server can persist darkMode in preferences.
 * Visual container uses Tailwind classes for a glassy panel in light/dark modes.
 * Can update username, email, password, aiLevel, avatar, and delete the account.
 * @returns {JSX.Element} The rendered component
 */
export default function AccountPage() {
    const { theme } = useTheme();
    const { user, setUser } = useSession();
    console.log(user)

    // Local state for profile fields
    const [username, setUsername] = useState(user?.username ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [password, setPassword] = useState("");
    const [aiLevel, setAiLevel] = useState<AILevel>("child");

    // Avatar (preview-only for now)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!user) return;
        setUsername(user.username ?? "");
        setEmail(user.email ?? "");
        setAiLevel("child");
        // set avatarPreview from user.avatarUrl when you add it later
    }, [user]);

    // Handle form updates
    const handleUpdate = async () => {
        setSaving(true);
        try {
            let body: BodyInit;
            let headers: HeadersInit | undefined;

            if (avatarFile) {
                const form = new FormData();
                form.append("username", username);
                form.append("email", email);
                if (password) form.append("password", password);
                form.append("aiLevel", aiLevel);
                form.append("darkMode", String(theme === "dark"));
                form.append("avatar", avatarFile);
                body = form; // do NOT set Content-Type for FormData
            } else {
                headers = { "Content-Type": "application/json" };
                body = JSON.stringify({
                    username,
                    email,
                    password: password || undefined,
                    aiLevel,
                    darkMode: theme === "dark",
                });
            }

            const res = await fetch("/api/account", { method: "PUT", headers, body });

            // Only parse JSON if the server returned JSON
            const ctype = res.headers.get("content-type") || "";
            if (!ctype.includes("application/json")) {
                const text = await res.text(); // likely an HTML error page
                console.error("Non-JSON response from /api/account:", text);
                alert("Upload failed. Check server logs for details.");
                return;
            }

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Update failed");
                return;
            }

            setUser(data.user);
            alert("Updated!");
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Request failed");
        } finally {
            setSaving(false);
        }
    };

    // Handle account deletion
    const handleDelete = async () => {
        if (!confirm("Delete your account? This cannot be undone.")) return;
        setDeleting(true);
        try {
            const res = await fetch("/api/account", { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            setUser(null);
            window.location.href = "/";
        } catch (e: any) {
            alert(e.message || "Delete failed");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <main className="min-h-[80vh] px-4 md:px-8 py-10">
            {/* Floating window / card */}
            <div className="mx-auto max-w-6xl rounded-3xl bg-white/80 dark:bg-zinc-800/75 backdrop-blur-md shadow-2xl ring-1 ring-black/5 dark:ring-white/10 p-6 md:p-10">
                <h1 className="text-3xl font-semibold mb-8">My Account</h1>

                <div className="grid gap-10 grid-cols-1 lg:grid-cols-[1fr_320px]">
                    <section>
                        <ProfileFields
                            username={username}
                            email={email}
                            password={password}
                            setUsername={setUsername}
                            setEmail={setEmail}
                            setPassword={setPassword}
                        />

                        <Preferences
                            aiLevel={aiLevel}
                            setAiLevel={setAiLevel}
                            onDelete={handleDelete}
                            onUpdate={handleUpdate}
                            saving={saving}
                            deleting={deleting}
                        />
                    </section>

                    <Avatar
                        displayName={username}
                        avatarPreview={avatarPreview}
                        setAvatarPreview={setAvatarPreview}
                        setAvatarFile={setAvatarFile}
                    />
                </div>
            </div>
        </main>
    );
}
