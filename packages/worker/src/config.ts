import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(500).default(5000),
  WORKER_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(3),
});

export function loadWorkerConfig(env: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(env);
}
