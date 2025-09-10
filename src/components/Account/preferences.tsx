// src/app/components/Account/preferences.tsx
"use client";
/**
 * Preferences
 * - Dark mode toggle via next-themes (light <-> dark).
 * - AI response level radio group (child, student, advanced).
 * - Update/Delete buttons delegate to parent handlers.
 * - Pure UI; persistence handled by parent (AccountPage).
 */

import { useEffect, useRef, useState } from "react";

import { useTheme } from "next-themes";

type AILevel = "child" | "student" | "advanced";

interface PreferencesProps {
  aiLevel: AILevel;
  setAiLevel: (level: AILevel) => void;
  onDelete: () => void;
  onUpdate: () => void;
  saving: boolean;
  deleting: boolean;
}

export default function Preferences({
  aiLevel,
  setAiLevel,
  onDelete,
  onUpdate,
  saving,
  deleting,
}: PreferencesProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-3">Preferences</h2>

      {/* Dark mode */}
      <div className="flex items-center gap-3 mb-6">
        <span>dark mode</span>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            theme === "dark" ? "bg-blue-600" : "bg-zinc-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              theme === "dark" ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* AI level */}
      <h3 className="text-lg font-medium mb-2">AI Response level</h3>
      <div className="space-y-3">
        {[
          { key: "child", title: "Child Friendly", desc: "Suitable for children ages 8 - 12 years" },
          { key: "student", title: "Student", desc: "University level" },
          { key: "advanced", title: "Advanced", desc: "Professional level" },
        ].map((opt) => (
          <label key={opt.key} className="flex gap-3 items-start">
            <input
              type="radio"
              className="mt-1"
              checked={aiLevel === (opt.key as AILevel)}
              onChange={() => setAiLevel(opt.key as AILevel)}
            />
            <div className="leading-tight">
              <div className="font-medium">{opt.title}</div>
              <div className="text-xs opacity-70">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Buttons */}
      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={onDelete}
          disabled={deleting}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete Account"}
        </button>
        <button
          onClick={onUpdate}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Update"}
        </button>
      </div>
    </div>
  );
}
