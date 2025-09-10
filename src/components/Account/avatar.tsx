"use client";
/**
 * Avatar
 * - Circular avatar with initial fallback (first letter of displayName).
 * - Local preview using URL.createObjectURL before server persistence.
 * - Hidden <input type="file" /> triggered via label; passes File back to parent.
 * - No direct upload logic here; parent bundles image in FormData for /api/account.
 */

interface AvatarProps {
    avatarPreview: string | null;
    setAvatarPreview: (url: string | null) => void;
    setAvatarFile: (file: File | null) => void;
    displayName: string; // use username for initial
}

export default function Avatar({
    avatarPreview,
    setAvatarPreview,
    setAvatarFile,
    displayName,
}: AvatarProps) {
    const initial = (displayName || "U").charAt(0).toUpperCase();

    return (
        <aside className="flex flex-col items-center">
            {/* Circular avatar */}
            <div className="relative w-44 h-44 rounded-full overflow-hidden grid place-items-center bg-gradient-to-br from-orange-400 to-orange-600 dark:from-zinc-700 dark:to-zinc-700 text-white text-5xl font-semibold ring-2 ring-white/80 dark:ring-zinc-700 shadow-lg">
                {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                    <span>{initial}</span>
                )}
            </div>

            {/* Upload/Delete controls in a soft card */}
            <div className="mt-6 w-56 rounded-2xl bg-white/70 dark:bg-zinc-700/70 backdrop-blur p-4 text-center shadow-md ring-1 ring-black/5 dark:ring-white/10">
                <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setAvatarFile(f);
                        setAvatarPreview(URL.createObjectURL(f));
                    }}
                />
                <label
                    htmlFor="avatar-input"
                    className="block w-full mb-3 rounded-lg bg-blue-600 text-white py-2 cursor-pointer hover:bg-blue-700"
                >
                    Upload
                </label>
                <button
                    disabled={!avatarPreview}
                    onClick={() => {
                        setAvatarPreview(null);
                        setAvatarFile(null);
                    }}
                    className="w-full rounded-lg bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-white py-2 disabled:opacity-50"
                >
                    Delete
                </button>
            </div>
        </aside>
    );
}
