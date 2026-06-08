import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { dispatchPostySyncEvents, getDispatchConfigState } from "@/lib/posty/dispatch";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const configState = getDispatchConfigState();

  if (!configState.configured) {
    return NextResponse.json(
      { error: "dispatch_not_configured" },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const result = await dispatchPostySyncEvents(
    supabase,
    configState.postyConfig,
  );

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function isAuthorized(request: NextRequest) {
  const expectedSecret = process.env.POSTY_SYNC_DISPATCH_SECRET?.trim();

  if (!expectedSecret) {
    return false;
  }

  const token = readBearerToken(request.headers.get("authorization"));

  if (!token) {
    return false;
  }

  return safeEqual(token, expectedSecret);
}

function readBearerToken(authorizationHeader: string | null) {
  const prefix = "Bearer ";

  if (!authorizationHeader?.startsWith(prefix)) {
    return null;
  }

  return authorizationHeader.slice(prefix.length).trim() || null;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
