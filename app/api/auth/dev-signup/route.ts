import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[auth-dev-signup]";

export async function POST(request: NextRequest) {
  let payload: { email?: unknown; password?: unknown };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const password =
    typeof payload.password === "string" ? payload.password : "";

  if (!email) {
    return NextResponse.json(
      { error: "이메일을 입력해 주세요." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "올바른 이메일 형식을 입력해 주세요." },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "비밀번호는 6자 이상이어야 해요." },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    console.log(`${LOG_PREFIX} createUser`, {
      email,
      userId: data.user?.id ?? null,
      error: error
        ? {
            message: error.message,
            name: error.name,
            status: error.status,
            code: error.code,
          }
        : null,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 500 },
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "회원가입을 완료하지 못했어요." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        userId: data.user.id,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "회원가입 처리 중 오류가 발생했습니다.";

    console.error(`${LOG_PREFIX} failed`, { email, message });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
