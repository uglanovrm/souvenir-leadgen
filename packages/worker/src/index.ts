import { loadWorkerConfig } from "./config.js";

const config = loadWorkerConfig();

console.log(
  [
    "souvenir-leadgen worker stub",
    `pollIntervalMs=${config.WORKER_POLL_INTERVAL_MS}`,
    `maxAttempts=${config.WORKER_MAX_ATTEMPTS}`,
  ].join(" "),
);

if (!config.NEXT_PUBLIC_SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
  console.log("Supabase credentials are not configured; worker exits in stub mode.");
  process.exit(0);
}

console.log("Supabase credentials detected; polling implementation is added in ISSUE-008.");
