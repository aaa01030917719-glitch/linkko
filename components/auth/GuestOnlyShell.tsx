"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";

interface GuestOnlyShellProps {
  children: React.ReactNode;
}

export default function GuestOnlyShell({ children }: GuestOnlyShellProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    router.replace("/dashboard");
  }, [loading, router, user]);

  if (loading) {
    return <AuthLoadingScreen message="로그인 상태를 확인하고 있어요." />;
  }

  if (user) {
    return <AuthLoadingScreen message="대시보드로 이동하고 있어요." />;
  }

  return <>{children}</>;
}
