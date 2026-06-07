import { createClient } from "@supabase/supabase-js";
import { loadWorkerConfig } from "./config.js";
import { handleJob } from "./handlers.js";
import { claimNextJob, markJobFailedOrRetry, markJobSucceeded } from "./jobs.js";
import { log } from "./logger.js";

const config = loadWorkerConfig();

log("info", "worker.start", {
  workerId: config.WORKER_ID,
  pollIntervalMs: config.WORKER_POLL_INTERVAL_MS,
  maxAttempts: config.WORKER_MAX_ATTEMPTS,
});

if (!config.NEXT_PUBLIC_SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
  log("warn", "worker.stub_exit", {
    reason: "Supabase credentials are not configured",
  });
  process.exit(0);
}

const supabase = createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function processOneJob() {
  const job = await claimNextJob(supabase, config.WORKER_ID, config.WORKER_LEASE_MS);

  if (!job) {
    log("info", "worker.idle", { workerId: config.WORKER_ID });
    return;
  }

  log("info", "job.claimed", {
    jobId: job.id,
    type: job.type,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
  });

  try {
    const result = await handleJob(job);
    await markJobSucceeded(supabase, job.id, result);
    log("info", "job.succeeded", { jobId: job.id, type: job.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markJobFailedOrRetry(supabase, job, message);
    log("error", "job.failed_or_requeued", { jobId: job.id, type: job.type, error: message });
  }
}

async function main() {
  do {
    await processOneJob();

    if (config.WORKER_RUN_ONCE) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, config.WORKER_POLL_INTERVAL_MS));
  } while (true);
}

main().catch((error: unknown) => {
  log("error", "worker.crash", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
