"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Context & Components
import { useSession } from "@/context/SessionContext";
import { useAuthContext } from "@/context/AuthContext";
import Modal from "@/components/Modal";
import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";

// -------------------------
// Navigation Configuration
// -------------------------
const getNavLinks = (paperId?: string | string[]) => [
  { name: "Flash Cards", href: `/paper_view/${paperId}/flashcards` },
  { name: "Summaries", href: `/paper_view/${paperId}/summaries` },
  { name: "Study Guides", href: `/paper_view/${paperId}/studyGuide` },
  { name: "Glossary", href: `/paper_view/${paperId}/glossary` },
  { name: "Problem Sets", href: `/paper_view/${paperId}/problemSets` },
];

// -------------------------
// Main Nav
// -------------------------
export default function Nav({ showAuth = true }: { showAuth?: boolean }) {
  const { activeForm, setActiveForm } = useAuthContext();
  const { user, setUser, loading } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const { paperId } = useParams();

  // 1. Logic: Determine Current View
  const isPaperView = !!paperId;
  const isAccountPage = pathname.startsWith("/account");

  // 2. Logic: Inactivity Timer
  useEffect(() => {
    if (!user || activeForm || isHovered || isAccountPage) {
        setCollapsed(false);
        return;
    }

    const timer = setTimeout(() => setCollapsed(true), 500);
    return () => clearTimeout(timer);
  }, [user, activeForm, isHovered, pathname]);

  const handleLogout = async () => {
    const res = await fetch("/api/remove_session");
    if (res.ok) {
      setUser(null);
      router.push("/");
    }
  };

  if (!showAuth) return null;
  if (loading) return <div className="h-16 w-full bg-transparent" />; // Barebones placeholder

  return (
    <>
      <header className="fixed top-0 w-full z-50 px-4 py-2">
        <AnimatePresence mode="wait">
          {/* CASE 1: NOT LOGGED IN */}
          {!user && (
            <motion.nav key="guest" {...navFadeIn} className="nav-container hidden md:flex justify-between">
              <Logo href="/" />
              <div className="nav-account-section flex gap-1">
                <Link href="/about">About</Link>
                <button onClick={() => setActiveForm("signIn")}>Login</button>
                <button onClick={() => setActiveForm("signUp")} className="btn-primary">Sign Up</button>
              </div>
            </motion.nav>
          )}

          {/* CASE 2: LOGGED IN & COLLAPSED */}
          {user && collapsed && (
            <DotMenu key="dots" onHover={() => setCollapsed(false)} />
          )}

          {/* CASE 3: LOGGED IN & EXPANDED */}
          {user && !collapsed && (
            <motion.nav 
              key="user-nav" 
              {...navFadeIn} 
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="nav-container flex justify-between items-center"
            >
              <Logo href="/dashboard" />
              
              <div className="flex gap-6 items-center">
                {isPaperView && !isAccountPage && (
                  <div className="nav-links-container flex gap-2">
                    {getNavLinks(paperId).map(link => (
                      <Link key={link.href} href={link.href} className="hover:text-blue-500 transition">
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}
                
                <div className="nav-account-section flex gap-1">
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/account">Account</Link>
                  <button onClick={handleLogout} className="text-red-400">Logout</button>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Auth Modals */}
      <AnimatePresence>
        {activeForm === "signIn" && (
          <Modal isOpen onClose={() => setActiveForm(null)}>
            <SignInForm closeForm={() => setActiveForm(null)} />
          </Modal>
        )}
        {activeForm === "signUp" && (
          <Modal isOpen onClose={() => setActiveForm(null)}>
            <SignUpForm closeForm={() => setActiveForm(null)} />
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// -------------------------
// Small Helper Components
// -------------------------
const Logo = ({ href }: { href: string }) => (
  <Link href={href} className="shrink-0">
    <Image src="/icons/Note_Pilot_logo.svg" alt="Logo" width={40} height={40} />
  </Link>
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

const navFadeIn = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 }
};

const dotFade = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};