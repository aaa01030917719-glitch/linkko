import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DispatchEventResult,
  PostySyncEventRecord,
  PostySyncEventStatus,
  SafePostyResponse,
} from "@/lib/posty/payload";
import {
  getPostySyncClientConfig,
  postLinkkoEventToPosty,
  type PostySyncClientConfig,
} from "@/lib/posty/sync-client";

const DISPATCH_LIMIT = 10;
const MAX_ATTEMPTS = 5;
const STALE_SENDING_MINUTES = 10;
const RETRY_DELAYS_MINUTES = [2, 5, 15, 60] as const;
const DISPATCHABLE_STATUSES: PostySyncEventStatus[] = [
  "pending",
  "retry_scheduled",
];

export interface DispatchSummary {
  ok: true;
  processed: number;
  succeeded: number;
  retryScheduled: number;
  failed: number;
  skipped: number;
  recoveredStaleSending: number;
  events: DispatchEventResult[];
}

export type DispatchConfigState =
  | { configured: true; postyConfig: PostySyncClientConfig }
  | { configured: false };

export function getDispatchConfigState(): DispatchConfigState {
  const postyConfig = getPostySyncClientConfig();

  if (!postyConfig || !process.env.POSTY_SYNC_DISPATCH_SECRET?.trim()) {
    return { configured: false };
  }

  return { configured: true, postyConfig };
}

export async function dispatchPostySyncEvents(
  supabase: SupabaseClient,
  postyConfig: PostySyncClientConfig,
): Promise<DispatchSummary> {
  const now = new Date();
  const recoveredStaleSending = await recoverStaleSendingEvents(supabase, now);
  const events = await fetchDueEvents(supabase, now);
  const results: DispatchEventResult[] = [];

  for (const event of events) {
    const claimedEvent = await claimEventForSending(supabase, event, now);

    if (!claimedEvent) {
      results.push({
        id: event.id,
        status: "skipped",
        attemptCount: event.attempt_count,
        postyStatus: null,
      });
      continue;
    }

    const attemptCount = claimedEvent.attempt_count + 1;

    try {
      const postyResponse = await postLinkkoEventToPosty(
        postyConfig,
        claimedEvent.payload,
      );

      if (postyResponse.ok) {
        await markEventSucceeded(supabase, claimedEvent.id, attemptCount, postyResponse);
        results.push({
          id: claimedEvent.id,
          status: "succeeded",
          attemptCount,
          postyStatus: postyResponse.status,
        });
      } else {
        const status = await markEventFailedOrRetrying(
          supabase,
          claimedEvent.id,
          attemptCount,
          postyResponse,
        );
        results.push({
          id: claimedEvent.id,
          status,
          attemptCount,
          postyStatus: postyResponse.status,
        });
      }
    } catch (error) {
      const postyResponse: SafePostyResponse = {
        ok: false,
        status: null,
        body: serializeDispatchError(error),
      };
      const status = await markEventFailedOrRetrying(
        supabase,
        claimedEvent.id,
        attemptCount,
        postyResponse,
      );
      results.push({
        id: claimedEvent.id,
        status,
        attemptCount,
        postyStatus: null,
      });
    }
  }

  return {
    ok: true,
    processed: results.length,
    succeeded: countByStatus(results, "succeeded"),
    retryScheduled: countByStatus(results, "retry_scheduled"),
    failed: countByStatus(results, "failed"),
    skipped: countByStatus(results, "skipped"),
    recoveredStaleSending,
    events: results,
  };
}

async function recoverStaleSendingEvents(
  supabase: SupabaseClient,
  now: Date,
) {
  const cutoff = new Date(now.getTime() - STALE_SENDING_MINUTES * 60 * 1000);
  const { data, error } = await supabase
    .from("posty_sync_events")
    .update({
      status: "retry_scheduled",
      next_retry_at: now.toISOString(),
      posty_response: {
        ok: false,
        status: null,
        body: {
          error: "stale_sending_recovered",
        },
      },
    })
    .eq("status", "sending")
    .lte("updated_at", cutoff.toISOString())
    .select("id");

  if (error) {
    throw error;
  }

  return data?.length ?? 0;
}

async function fetchDueEvents(
  supabase: SupabaseClient,
  now: Date,
): Promise<PostySyncEventRecord[]> {
  const { data, error } = await supabase
    .from("posty_sync_events")
    .select("id,payload,status,attempt_count,next_retry_at,created_at")
    .in("status", DISPATCHABLE_STATUSES)
    .or(`next_retry_at.is.null,next_retry_at.lte.${now.toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(DISPATCH_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []) as PostySyncEventRecord[];
}

async function claimEventForSending(
  supabase: SupabaseClient,
  event: PostySyncEventRecord,
  now: Date,
): Promise<PostySyncEventRecord | null> {
  const { data, error } = await supabase
    .from("posty_sync_events")
    .update({
      status: "sending",
      updated_at: now.toISOString(),
    })
    .eq("id", event.id)
    .in("status", DISPATCHABLE_STATUSES)
    .or(`next_retry_at.is.null,next_retry_at.lte.${now.toISOString()}`)
    .select("id,payload,status,attempt_count,next_retry_at,created_at")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PostySyncEventRecord | null) ?? null;
}

async function markEventSucceeded(
  supabase: SupabaseClient,
  eventId: string,
  attemptCount: number,
  postyResponse: SafePostyResponse,
) {
  const attemptedAt = new Date().toISOString();

  const { error } = await supabase
    .from("posty_sync_events")
    .update({
      status: "succeeded",
      attempt_count: attemptCount,
      last_attempt_at: attemptedAt,
      next_retry_at: null,
      posty_response: serializePostyResponse(postyResponse),
    })
    .eq("id", eventId);

  if (error) {
    throw error;
  }
}

async function markEventFailedOrRetrying(
  supabase: SupabaseClient,
  eventId: string,
  attemptCount: number,
  postyResponse: SafePostyResponse,
): Promise<"retry_scheduled" | "failed"> {
  const attemptedAt = new Date();
  const nextRetryAt = getNextRetryAt(attemptCount, attemptedAt);
  const status = nextRetryAt ? "retry_scheduled" : "failed";

  const { error } = await supabase
    .from("posty_sync_events")
    .update({
      status,
      attempt_count: attemptCount,
      last_attempt_at: attemptedAt.toISOString(),
      next_retry_at: nextRetryAt?.toISOString() ?? null,
      posty_response: serializePostyResponse(postyResponse),
    })
    .eq("id", eventId);

  if (error) {
    throw error;
  }

  return status;
}

function getNextRetryAt(attemptCount: number, attemptedAt: Date) {
  if (attemptCount >= MAX_ATTEMPTS) {
    return null;
  }

  const delayMinutes = RETRY_DELAYS_MINUTES[attemptCount - 1];

  if (!delayMinutes) {
    return null;
  }

  return new Date(attemptedAt.getTime() + delayMinutes * 60 * 1000);
}

function serializePostyResponse(postyResponse: SafePostyResponse) {
  return {
    ok: postyResponse.ok,
    status: postyResponse.status,
    body: postyResponse.body,
  };
}

function serializeDispatchError(error: unknown) {
  if (!(error instanceof Error)) {
    return { error: "unknown_error" };
  }

  return {
    error: error.name || "dispatch_error",
    message: error.message.slice(0, 300),
  };
}

function countByStatus(
  results: DispatchEventResult[],
  status: DispatchEventResult["status"],
) {
  return results.filter((result) => result.status === status).length;
}
