import type { User } from "@supabase/supabase-js";

export function getUserDisplayName(user: User | null | undefined) {
  const candidates = [
    user?.user_metadata?.name,
    user?.user_metadata?.full_name,
    user?.user_metadata?.nickname,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

export function getUserAvatarFallback(user: User | null | undefined) {
  const displayName = getUserDisplayName(user);

  if (displayName) {
    return displayName.charAt(0).toUpperCase();
  }

  return user?.email?.charAt(0).toUpperCase() ?? "?";
}
