export type PostySyncEventStatus =
  | "pending"
  | "sending"
  | "succeeded"
  | "retry_scheduled"
  | "failed";

export interface PostySyncEventRecord {
  id: string;
  payload: unknown;
  status: PostySyncEventStatus;
  attempt_count: number;
  next_retry_at: string | null;
  created_at: string;
}

export interface SafePostyResponse {
  ok: boolean;
  status: number | null;
  body: unknown;
}

export interface DispatchEventResult {
  id: string;
  status: "succeeded" | "retry_scheduled" | "failed" | "skipped";
  attemptCount: number;
  postyStatus: number | null;
}
