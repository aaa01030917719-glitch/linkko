import LoginForm from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 | Linkko",
};

export default function LoginPage() {
  return <LoginForm />;
}
