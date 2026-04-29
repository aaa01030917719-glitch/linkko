import { createBrowserClient } from "@supabase/ssr";
import {
  supabaseBrowserAuthOptions,
  supabaseCookieOptions,
} from "@/lib/supabase/options";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: supabaseBrowserAuthOptions,
      cookieOptions: supabaseCookieOptions,
    }
  );
}
