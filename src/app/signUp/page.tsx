import SignUpForm from "@/components/SignUpForm";
import Image from "next/image"; // for provider logos
export default function SignIn() {
  return (
      <div className="signUpPage-container">
        <div className="signUp-page-content-container">
          <h1>Welcome to note pilot</h1>
          <Image src="/note_pilot_logo.svg" alt="NotePilot Logo" className="sign-up-page-logo"width={50} height={50} />
        </div>
        <SignUpForm/>
      </div>
  );
}
