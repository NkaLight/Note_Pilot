"use client";
/**
 * ProfileFields
 * - Bubble-style inputs for username, email, and password.
 * - Password left blank => unchanged on save.
 * - Stateless: consumes/updates values via props so parent owns source of truth.
 */

interface Props {
  username: string;
  email: string;
  password: string;
  setUsername: (v: string) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
}

export default function ProfileFields({
  username, email, password,
  setUsername, setEmail, setPassword,
}: Props) {
  const inputClass =
    "mt-1 w-full rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 shadow-inner px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-400";
  const labelClass = "block text-sm font-medium dark:text-zinc-200";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-1">
        <label className={labelClass}>Username</label>
        <input
          className={inputClass}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="md:col-span-1">
        <label className={labelClass}>Email Address</label>
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Password</label>
        <input
          type="password"
          placeholder="*********************"
          className={inputClass}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </div>
  );
}
