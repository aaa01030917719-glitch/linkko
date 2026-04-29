export const SUPABASE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const supabaseCookieOptions = {
  maxAge: SUPABASE_SESSION_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export const supabaseBrowserAuthOptions = {
  autoRefreshToken: true,
  persistSession: true,
};
