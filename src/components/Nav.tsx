"use client";
import Modal from "@/components/Modal"; // reusable modal from earlier
import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";
import { useSession } from "@/context/SessionContext";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image"; // for provider logos
import Link from 'next/link';
import { useParams, usePathname, useRouter, } from "next/navigation";
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
  paperId
}: {
  username: string;
  popAccountForm: () => void;
  onhoverStart:() => void;
  onhoverEnd: () => void;
  handleLogout:() => void;
  paperId:number

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
        src="/icons/Note_Pilot_logo.svg"
        alt="Note Pilot Logo"
        width={48}
        height={48}
        className="nav-logo"
      />
    </Link>
    <div className="nav-links-container flex gap-2">
      <Link href={`/paper_view/${paperId}/flashcards`}>Flash Cards</Link>
      <Link href={`/paper_view/${paperId}/summaries`}>Summaries</Link>
      <Link href={`/paper_view/${paperId}/studyGuide`}>Study Guides</Link>
      <Link href={`/paper_view/${paperId}/glossary`}>Glossary</Link>
      <Link href={`/paper_view/${paperId}/problemSets`}>Problem Sets</Link>
      <Link href={`/paper_view/${paperId}/pdfs`}>PDFs</Link>

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
    <Link href="/">
        <Image
          src="/icons/Note_Pilot_logo.svg"
          alt="Note Pilot Logo"
          width={48}
          height={48}
          className="nav-logo"
        />
    </Link>
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
export default function Nav({ showAuth = true}: { showAuth?: boolean}) {
  const [activeForm, setActiveForm] = useState<"signin" | "signup" | "account"| null>(
    null
  );
  const router = useRouter();
  const { user, setUser, loading } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [hover, setHover] = useState(false)
  const pathname = usePathname();

  const params = useParams();
  const paperId: number =  Number(params.paperId);
  

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
        router.push("/");
        setUser(null);
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
    {user && !Number.isNaN(paperId) &&  //User is logged in and has chosen a paper
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
            handleLogout={handleLogout} 
            paperId={paperId}
            />
          )
        }
      </AnimatePresence>
      )
    }
    {user && Number.isNaN(paperId) &&  //User is logged in no paper chosen yet
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