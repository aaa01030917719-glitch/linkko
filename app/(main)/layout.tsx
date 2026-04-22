import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="w-full max-w-2xl mx-auto px-4 pt-6 pb-36">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
