import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(500).default(5000),
  WORKER_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(3),
  WORKER_ID: z.string().min(1).default("local-worker-1"),
  WORKER_LEASE_MS: z.coerce.number().int().min(1000).default(60000),
  WORKER_RUN_ONCE: z.coerce.boolean().default(false),
});

export function loadWorkerConfig(env: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(env);
}
