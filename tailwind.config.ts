/**
 * Tailwind config
 * - Enables class-based dark mode so next-themes can toggle via `.dark` on <html>.
 * - Scans app/components/src for utility extraction.
 */

import type { Config } from "tailwindcss";

export default {
  darkMode: "class", // 👈 makes `dark:` respond to .dark on <html>
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      animation: {
        // You can adjust '2s' to make it faster or slower
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
} satisfies Config;
