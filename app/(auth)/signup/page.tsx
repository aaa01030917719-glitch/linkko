import SignupForm from "@/components/auth/SignupForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 | Linkko",
};

export default function SignupPage() {
  return <SignupForm />;
}
