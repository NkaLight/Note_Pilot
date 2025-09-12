// components/ThemeInit.tsx
"use client";
/**
 * ThemeInit
 * - Client-only bridge that syncs theme on mount based on the logged-in user's prefs.
 * - Reads user from SessionContext, sets 'dark' or 'light' with next-themes.
 * - No UI; safe no-op if user or preference is missing.
 */

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSession } from "@/context/SessionContext";

export default function ThemeInit() {
    const { setTheme } = useTheme();
    const { user } = useSession();

    useEffect(() => {
	
    // If your session exposes a boolean (preferred)
	if (user && typeof (user as any).darkMode === "boolean") {
		setTheme((user as any).darkMode ? "dark" : "light");
    }
    // Or if stored under preferences.dark_mode
	const pref = (user as any)?.preferences;
	if (pref && typeof pref.dark_mode === "boolean") {
		setTheme(pref.dark_mode ? "dark" : "light");
    }


    }, [user, setTheme]);

    return null;
}
