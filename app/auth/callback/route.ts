import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeNextPath } from "@/lib/supabase/auth-redirect";

/**
 * Supabase Auth 콜백 핸들러
 * 구글 OAuth / 이메일 매직링크 모두 이 경로로 리다이렉트됨
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = normalizeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
