"use client";
import {motion, AnimatePresence} from "framer-motion";
import { useEffect, useState } from "react";
import SignInForm from "@/components/SignInForm";
import Modal from "@/components/Modal"; // reusable modal from earlier
import { useSession } from "@/context/SessionContext";
import {useRouter} from "next/navigation"
import Image from "next/image"; // for provider logos

// -------------------------
// Animations
// -------------------------
const navFadeIn = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const dotFade = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.3 } },
};


// -------------------------
// Subcomponents
// -------------------------
const BarebonesNav = () => (
  <nav className="nav-container">
    {/* Empty div so layout stays consistent */}
    <div className="nav-links-container h-12" />
  </nav>
);

const DotMenu = ({ onHover }: { onHover: () => void }) => (
  <motion.div
    className="nav-dot-menu"
    onMouseEnter={onHover}
    variants={dotFade}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {[...Array(3)].map((_, i) => (
      <span key={i} className="w-5 h-5 rounded-full bg-white inline-block m-1" />
    ))}
  </motion.div>
);

const UserNav = ({
  username,
  handleLogout,
}: {
  username: string;
  handleLogout: () => void;
}) => (
  <motion.nav
    className="nav-container flex items-center justify-between"
    variants={navFadeIn}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <div>Welcome back {username}</div>
    <div className="nav-links-container flex gap-4">
      <a href="">Courses</a>
      <a href="">Summaries</a>
    </div>
    <div className="nav-account-section flex gap-2">
      <a onClick={handleLogout}>Logout</a>
      <a href="signUp">Account</a>
    </div>
  </motion.nav>
);

const GuestNav = ({ onLoginClick }: { onLoginClick: () => void }) => (
  <motion.nav
    className="nav-container flex items-center justify-between"
    variants={navFadeIn}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <Image
      src="/icons/Note_Pilot_logo.svg"
      alt="Note Pilot Logo"
      width={48}
      height={48}
      className="nav-logo"
    />
    <div className="nav-links-container flex gap-4">
      <a href="">About us</a>
      <a href="">Pricing</a>
    </div>
    <div className="nav-account-section flex gap-2">
      <a onClick={onLoginClick}>Login</a>
      <a href="signUp">Sign Up</a>
    </div>
  </motion.nav>
);

// -------------------------
// Main Nav
// -------------------------
export default function Nav({ showAuth = true }: { showAuth?: boolean }) {
  const [activeForm, setActiveForm] = useState<"signin" | "signup" | null>(
    null
  );
  const router = useRouter();
  const { user, setUser, loading } = useSession();
  const [collapsed, setCollapsed] = useState(false);


// Track inactivity → collapse after 5s without user activity
useEffect(() => {
  if (!showAuth || loading) return;

  let timer: ReturnType<typeof setTimeout> | null = null;

  const start = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setCollapsed(true), 8000);
  };

  const onActivity = () => {
    // If user interacts and we were collapsed, expand immediately
    if (collapsed) setCollapsed(false);
    start();
  };

  // Bind a few common activity events
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") onActivity();
  });

  // Kick off the first timer
  start();

  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener("visibilitychange", onActivity);
  };
}, [showAuth, loading, collapsed]);


  const handleLogout = async () => {
    try {
      const res = await fetch("/api/remove_session", { method: "GET" });
      if (res.ok) {
        setUser(null);
        router.push("/");
      } else {
        alert("Failed to log out.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const closeSignInModal = () => {
    setActiveForm(null);
    setTimeout(() => router.push("/ai/dashboard"), 500);
  };

  if (!showAuth) return null;

  // Show barebones nav while loading state resolves
  if (loading) return <BarebonesNav />;

  return (
    <>
      {user ? (
        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? (
            <DotMenu key={"dot"} onHover={() => setCollapsed(false)} />
          ) : (
            <UserNav key={"user"} username={user.username} handleLogout={handleLogout} />
          )}
        </AnimatePresence>
      ) : (
        <>
          <GuestNav key={"guest"} onLoginClick={() => setActiveForm("signin")} />
          {/* Animate Presence for sign/sign up modals */}
          <AnimatePresence mode="wait" initial={false}>
            {activeForm === "signin" && (
                <Modal
                isOpen={activeForm === "signin"}
                onClose={() => setActiveForm(null)}
            >
                    <SignInForm closeForm={closeSignInModal} />
                </Modal>
            )
            }
            </AnimatePresence>
        </>
      )}
    </>
  );
}