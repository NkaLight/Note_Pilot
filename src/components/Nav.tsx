"use client";
import Modal from "@/components/Modal";
import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";
import { useSession } from "@/context/SessionContext";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// -------------------------
// Animations
// -------------------------
const navFadeIn = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const guestNavFadeIn = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0, transition: { duration: 5 } },
  exit: { opacity: 0, y: 0, transition: { duration: 0.3 } },
};

const dotFade = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.3 } },
};

// -------------------------
// Hook for mobile detection
// -------------------------
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// -------------------------
// Subcomponents
// -------------------------
const BarebonesNav = () => (
  <nav className="nav-container">
    <div className="nav-links-container h-10" />
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

// -------------------------
// Shared Mobile Toggle Button
// -------------------------
const MobileToggle = ({ open, toggle }: { open: boolean; toggle: () => void }) => (
  <button
    className="block md:hidden p-2 text-black focus:outline-none"
    onClick={toggle}
  >
    {open ? "✕" : "☰"}
  </button>
);

// -------------------------
// Mobile Wrapper Nav 
// -------------------------
const MobileNavWrapper = ({
  logoHref,
  children,
  handleLogout
}: {
  logoHref: string;
  children: React.ReactNode;
  handleLogout?: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="nav-container flex flex-col md:hidden bg-black text-black p-2">
      <div className="flex justify-start items-center gap-3">
        {/* Toggle on LEFT side */}
        <MobileToggle open={menuOpen} toggle={() => setMenuOpen(!menuOpen)} />
        <Link href={logoHref}>
          <Image src="/icons/Note_Pilot_logo.svg" alt="Note Pilot Logo" width={44} height={44} />
        </Link>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="flex flex-col gap-3 mt-2 border-t border-gray-700 pt-3 pl-2"
          >
            {children}
            {handleLogout && (
              <a onClick={handleLogout} className="cursor-pointer text-red-400">
                Logout
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// -------------------------
// Desktop Navs 
// -------------------------
const AccountNav = ({ handleLogout }: { handleLogout: () => void }) => (
  <motion.nav
    className="nav-container hidden md:flex items-center justify-between"
    variants={navFadeIn}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <Link href="/dashboard">
      <Image src="/icons/Note_Pilot_logo.svg" alt="Note Pilot Logo" width={48} height={48} />
    </Link>
    <div className="nav-account-section flex gap-2">
      <Link href="/dashboard">Dashboard</Link>
      <a onClick={handleLogout}>Logout</a>
    </div>
  </motion.nav>
);

const DashboardNav = ({ handleLogout }: { handleLogout: () => void }) => (
  <motion.nav
    className="nav-container hidden md:flex items-center justify-between"
    variants={navFadeIn}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <Link href="/dashboard">
      <Image src="/icons/Note_Pilot_logo.svg" alt="Note Pilot Logo" width={48} height={48} />
    </Link>
    <div className="nav-account-section flex gap-2">
      <Link href="/account">Account</Link>
      <a onClick={handleLogout}>Logout</a>
    </div>
  </motion.nav>
);

const UserNav = ({
  aiLevel,
  handleLogout,
  paperId
}: {
  aiLevel?: string;
  handleLogout: () => void;
  paperId: number;
}) => (
  <motion.nav
    className="nav-container hidden md:flex items-center justify-between"
    variants={navFadeIn}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <Link href="/dashboard">
      <Image src="/icons/Note_Pilot_logo.svg" alt="Note Pilot Logo" width={48} height={48} />
    </Link>
    <div className="nav-links-container flex gap-2">
      <Link href={`/paper_view/${paperId}/flashcards`}>Flash Cards</Link>
      <Link href={`/paper_view/${paperId}/summaries`}>Summaries</Link>
      <Link href={`/paper_view/${paperId}/studyGuide`}>Study Guides</Link>
      <Link href={`/paper_view/${paperId}/glossary`}>Glossary</Link>
      <Link href={`/paper_view/${paperId}/problemSets`}>Problem Sets</Link>
      <Link href={`/paper_view/${paperId}/pdfs`}>PDFs</Link>
    </div>
    <div className="nav-account-section flex gap-2 items-center">
      {aiLevel && (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {aiLevel}
        </span>
      )}
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/account">Account</Link>
      <a onClick={handleLogout}>Logout</a>
    </div>
  </motion.nav>
);

const GuestNav = ({
  onLoginClick,
  onSignUpClick
}: {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}) => (
  <motion.nav
    className="nav-container hidden md:flex justify-between"
    variants={guestNavFadeIn}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <Link href="/">
      <Image src="/icons/Note_Pilot_logo.svg" alt="Note Pilot Logo" width={48} height={48} />
    </Link>
    <div className="nav-account-section flex gap-1">
      <a href="/about">About</a>
      <a onClick={onLoginClick}>Login</a>
      <a onClick={onSignUpClick}>Sign Up</a>
    </div>
  </motion.nav>
);

// -------------------------
// Main Nav
// -------------------------
export default function Nav({ showAuth = true }: { showAuth?: boolean }) {
  const [activeForm, setActiveForm] = useState<"signin" | "signup" | "account" | null>(null);
  const { user, setUser, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const paperId: number = Number(params.paperId);
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/remove_session", { method: "GET" });
      if (res.ok) {
        router.push("/");
        setUser(null);
      } else {
        alert("Failed to log out.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!showAuth) return null;
  if (loading) return <BarebonesNav />;

  // -------------------------
  // MOBILE VERSION 
  // -------------------------
  if (isMobile) {
    if (user && !Number.isNaN(paperId)) {
      return (
        <MobileNavWrapper logoHref="/dashboard" handleLogout={handleLogout}>
          <Link href={`/paper_view/${paperId}/flashcards`}>Flash Cards</Link>
          <Link href={`/paper_view/${paperId}/summaries`}>Summaries</Link>
          <Link href={`/paper_view/${paperId}/studyGuide`}>Study Guides</Link>
          <Link href={`/paper_view/${paperId}/glossary`}>Glossary</Link>
          <Link href={`/paper_view/${paperId}/problemSets`}>Problem Sets</Link>
          <Link href={`/paper_view/${paperId}/pdfs`}>PDFs</Link>
        </MobileNavWrapper>
      );
    }
    if (user && Number.isNaN(paperId)) {
      return (
        <MobileNavWrapper logoHref="/dashboard" handleLogout={handleLogout}>
          <Link href="/account">Account</Link>
          <Link href="/dashboard">Dashboard</Link>
        </MobileNavWrapper>
      );
    }
    return (
      <MobileNavWrapper logoHref="/">
        <Link href="/about">About</Link>
        <a onClick={() => setActiveForm("signin")}>Login</a>
        <a onClick={() => setActiveForm("signup")}>Sign Up</a>
      </MobileNavWrapper>
    );
  }

  // -------------------------
  // DESKTOP VERSION 
  // -------------------------
  return (
    <>
      {user && !Number.isNaN(paperId) && (
        <UserNav aiLevel={user.aiLevel} handleLogout={handleLogout} paperId={paperId} />
      )}
      {user && Number.isNaN(paperId) && <DashboardNav handleLogout={handleLogout} />}
      {!user && <GuestNav onLoginClick={() => setActiveForm("signin")} onSignUpClick={() => setActiveForm("signup")} />}

      <AnimatePresence mode="wait" initial={false}>
        {activeForm === "signin" && (
          <Modal isOpen onClose={() => setActiveForm(null)}>
            <SignInForm closeForm={() => setActiveForm(null)} />
          </Modal>
        )}
        {activeForm === "signup" && (
          <Modal isOpen onClose={() => setActiveForm(null)}>
            <SignUpForm closeForm={() => setActiveForm(null)} />
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
