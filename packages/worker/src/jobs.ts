import type { SupabaseClient } from "@supabase/supabase-js";
import { workerJobSchema, type WorkerJob } from "@souvenir-leadgen/shared";
import type { JobResult } from "./handlers.js";

type JobRow = {
  id: string;
  type: string;
  status: string;
  payload: Record<string, unknown> | null;
  attempts: number | null;
  max_attempts: number | null;
};

function toWorkerJob(row: JobRow): WorkerJob {
  return workerJobSchema.parse({
    id: row.id,
    type: row.type,
    status: row.status,
    payload: row.payload ?? {},
    attempts: row.attempts ?? 0,
    maxAttempts: row.max_attempts ?? 3,
  });
}

export async function claimNextJob(
  supabase: SupabaseClient,
  workerId: string,
  leaseMs: number,
) {
  const now = new Date();
  const nowIso = now.toISOString();
  const lockUntil = new Date(now.getTime() + leaseMs).toISOString();

  const { data: candidates, error: selectError } = await supabase
    .from("jobs")
    .select("id,type,status,payload,attempts,max_attempts")
    .in("status", ["queued", "running"])
    .lte("run_after", nowIso)
    .or(`locked_until.is.null,locked_until.lt.${nowIso}`)
    .order("created_at", { ascending: true })
    .limit(1);

  if (selectError) {
    throw selectError;
  }

  const candidate = candidates?.[0] as JobRow | undefined;

  if (!candidate || (candidate.attempts ?? 0) >= (candidate.max_attempts ?? 3)) {
    return null;
  }

  const { data, error } = await supabase
    .from("jobs")
    .update({
      status: "running",
      locked_by: workerId,
      locked_until: lockUntil,
      attempts: (candidate.attempts ?? 0) + 1,
      updated_at: nowIso,
    })
    .eq("id", candidate.id)
    .in("status", ["queued", "running"])
    .select("id,type,status,payload,attempts,max_attempts")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toWorkerJob(data as JobRow) : null;
}

export async function markJobSucceeded(
  supabase: SupabaseClient,
  jobId: string,
  result: JobResult,
) {
  const { error } = await supabase
    .from("jobs")
    .update({
      status: "succeeded",
      result,
      error: null,
      locked_by: null,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    throw error;
  }
}

export async function markJobFailedOrRetry(
  supabase: SupabaseClient,
  job: WorkerJob,
  errorMessage: string,
) {
  const shouldRetry = job.attempts < job.maxAttempts;
  const backoffMs = Math.min(60000, 1000 * 2 ** Math.max(0, job.attempts - 1));
  const { error } = await supabase
    .from("jobs")
    .update({
      status: shouldRetry ? "queued" : "failed",
      error: errorMessage,
      locked_by: null,
      locked_until: null,
      run_after: shouldRetry ? new Date(Date.now() + backoffMs).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (error) {
    throw error;
  }
}
