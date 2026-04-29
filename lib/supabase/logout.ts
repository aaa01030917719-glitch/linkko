import { createClient } from "@/lib/supabase/client";

interface RouterLike {
  replace: (href: string) => void;
  refresh: () => void;
}

export async function signOutAndRedirect(router: RouterLike) {
  const supabase = createClient();

  await supabase.auth.signOut({ scope: "local" });
  router.replace("/login");
  router.refresh();
}
