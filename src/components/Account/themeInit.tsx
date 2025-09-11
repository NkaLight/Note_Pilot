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
        // If the session is defined, and dark mode exists
        if (user?.darkMode !== undefined) {
            // set the theme to dark if user.darkMode is true, false otherwise
            setTheme(user.darkMode ? "dark" : "light");
            return;
        }
        // If the session is defined, and user.preferences exists
        if (user?.preferences !== undefined) {
            // set the theme to dark if user.darkMode is true, false otherwise
            setTheme(user.preferences?.darkMode ? "dark" : "light");
        }
    }, [user, setTheme]);

    return null;
}
