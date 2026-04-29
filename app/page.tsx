"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    router.replace(user ? "/dashboard" : "/login");
  }, [loading, router, user]);

  return (
    <AuthLoadingScreen
      message={
        loading
          ? "로그인 상태를 확인하고 있어요."
          : user
            ? "대시보드로 이동하고 있어요."
            : "로그인 페이지로 이동하고 있어요."
      }
    />
  );
}
