"use client";
import {motion, AnimatePresence} from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import SignInForm from "@/components/SignInForm";
import Modal from "@/components/Modal"; // reusable modal from earlier
import { useSession } from "@/context/SessionContext";
import {useRouter, } from "next/navigation"
import Link from 'next/link'
import Image from "next/image"; // for provider logos
import SignUpForm from "@/components/SignUpForm";
import { usePathname } from 'next/navigation';


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
}

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
const AccountNav = ({ handleLogout }: { handleLogout: () => void; }) => (
  <motion.nav
    className="nav-container flex items-center justify-between"
    variants={navFadeIn}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <Link href="/dashboard">
        <Image
          src="/icons/Note_Pilot_logo.svg"
          alt="Note Pilot Logo"
          width={48}
          height={48}
          className="nav-logo"
        />
    </Link>
    <div className="nav-account-section flex gap-2">
      <Link href="/dashboard">Dashboard</Link>
      <a onClick={handleLogout}>Logout</a>
    </div>
  </motion.nav>
);

const DashboardNav = ({ handleLogout }: { handleLogout: () => void; }) => (
  <motion.nav
    className="nav-container flex items-center justify-between"
    variants={navFadeIn}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    <Link href="/dashboard">
        <Image
          src="/icons/Note_Pilot_logo.svg"
          alt="Note Pilot Logo"
          width={48}
          height={48}
          className="nav-logo"
        />
    </Link>
    <div className="nav-account-section flex gap-2">
      <Link href="/account">Account</Link>
      <a onClick={handleLogout}>Logout</a>
    </div>
  </motion.nav>
);

const UserNav = ({
  username,
  popAccountForm,
  onhoverStart,
  onhoverEnd,
  handleLogout,
}: {
  username: string;
  popAccountForm: () => void;
  onhoverStart:() => void;
  onhoverEnd: () => void;
  handleLogout:() => void;

}) => (
  <motion.nav
    className="nav-container flex items-center justify-between"
    variants={navFadeIn}
    initial="initial"
    animate="animate"
    exit="exit"
    onHoverStart={onhoverStart}
    onHoverEnd={onhoverEnd}
  >
    <Link href="/dashboard">
      <Image
        src="../icons/Note_Pilot_logo.svg"
        alt="Note Pilot Logo"
        width={48}
        height={48}
        className="nav-logo"
      />
    </Link>
    <div className="nav-links-container flex gap-2">
      <Link href="/flashcards">Flash Cards</Link>
      <Link href="/summaries">Summaries</Link>
      <Link href="/studyGuide">Study Guides</Link>
      <Link href="/glossary">Glossary</Link>
      <Link href="/problemSets">Problem Sets</Link>

    </div>
    <div className="nav-account-section flex gap-2">
      <a onClick={handleLogout}>Logout</a>
      <Link href="/account">Account</Link>
    </div>
  </motion.nav>
);


const GuestNav = ({ onLoginClick, onSignUpClick }: { onLoginClick: () => void, onSignUpClick: () => void }) => (
  <motion.nav
    className="nav-container flex justify-between"
    variants={guestNavFadeIn}
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
    <div className="nav-account-section flex gap-1">
      <a onClick={onLoginClick}>Login</a>
      <a onClick={onSignUpClick}>Sign Up</a>
    </div>
  </motion.nav>
);

// -------------------------
// Main Nav
// -------------------------
export default function Nav({ showAuth = true, paperId }: { showAuth?: boolean, paperId?:number}) {
  const [activeForm, setActiveForm] = useState<"signin" | "signup" | "account"| null>(
    null
  );
  const router = useRouter();
  const { user, setUser, loading } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [hover, setHover] = useState(false)
  const pathname = usePathname();

  console.log(paperId)


// Track inactivity → collapse after 5s without user activity
useEffect(() => {
  if (!showAuth || loading || !user || activeForm || hover) return;

  let timer: ReturnType<typeof setTimeout> | null = null;

  const start = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setCollapsed(true), 15000);
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
    setTimeout(() => router.push("/dashboard"), 500);
  };

  if (!showAuth) return null;

  // Show barebones nav while loading state resolves
  if (loading) return <BarebonesNav />;

  return (
    <>
    {user && paperId !== undefined &&  //User is logged in and has chosen a paper
      (
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? 
          (
            <DotMenu key={"dot"} onHover={() => setCollapsed(false)} />
          ): 
            pathname.startsWith('/account') ? (
              // If user is on an account page, show AccountNav
              <AccountNav key="account" handleLogout={handleLogout} />
          ):(
            <UserNav
            key={"user"} 
            username={user.username} 
            onhoverStart={() => setHover(true)}
            onhoverEnd={() => setHover(false)} 
            popAccountForm={()=> setActiveForm("account")}
            handleLogout={handleLogout} />
          )
        }
      </AnimatePresence>
      )
    }
    {user && paperId === undefined &&  //User is logged in no paper chosen yet
      (
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? 
          (
            <DotMenu key={"dot"} onHover={() => setCollapsed(false)} />
          ): 
            pathname.startsWith('/account') ? (
              // If user is on an account page, show AccountNav
              <AccountNav key="account" handleLogout={handleLogout} />
          ):(
            <DashboardNav
            key={"user"}
            handleLogout={handleLogout} />
          )
        }
      </AnimatePresence>
      )
    }
    {
    !user && (
      <GuestNav key={"guest"} onLoginClick={() => setActiveForm("signin")} onSignUpClick={() => setActiveForm("signup")} />

    ) 
    }

      {/* {user ? 
        (
            <AnimatePresence mode="wait" initial={false}>
              {collapsed ? 
                (
                  <DotMenu key={"dot"} onHover={() => setCollapsed(false)} />
                ) : 
                    pathname.startsWith('/account') ? (
                      // If user is on an account page, show AccountNav
                      <AccountNav key="account" handleLogout={handleLogout} />
                    ):(
                      <UserNav
                      key={"user"} 
                      username={user.username} 
                      onhoverStart={() => setHover(true)}
                      onhoverEnd={() => setHover(false)} 
                      popAccountForm={()=> setActiveForm("account")}
                      handleLogout={handleLogout} />
                    )
              }
            </AnimatePresence>
        ) : 
        (
          <GuestNav key={"guest"} onLoginClick={() => setActiveForm("signin")} onSignUpClick={() => setActiveForm("signup")} />
        )
      } */}


      {/* Animate Presence for sign/sign/account up modals */}
      <AnimatePresence mode="wait" initial={false}>
        {activeForm === "signin" && (
            <Modal
            isOpen={activeForm === "signin"}
            onClose={() => setActiveForm(null)}
            key={"signin"}
        >
                <SignInForm closeForm={closeSignInModal} />
            </Modal>
        )
        }
        {
          activeForm === "signup" &&(
              <Modal
                  isOpen={activeForm === "signup"}
                  onClose={() => setActiveForm(null)}
                  key={"signup"}
              >
                  <SignUpForm closeForm={closeSignInModal} />
              </Modal>
              )
        }
        {
          activeForm === "account" && user &&(
            <Modal
              isOpen={activeForm === "account"}
              onClose={() => setActiveForm(null)}
              account={true}  
              >
                <div className="flex-gap-2 bg-black">
                  <Link href={"/account-management"} className="">Account</Link>
                  <Link href={"/account-management"} className="">Preferences</Link>
                  <div onClick={handleLogout} className="cu">Logout</div>
                </div>
              </Modal>
            )
          }
        </AnimatePresence>
    </>
  );
}