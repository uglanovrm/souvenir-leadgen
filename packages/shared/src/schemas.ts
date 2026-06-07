import { z } from "zod";

export const appRoleSchema = z.enum(["admin", "producer", "agent", "manager"]);

export const jobTypeSchema = z.enum([
  "score_lead",
  "generate_offer",
  "render_mockup",
  "qc_prototype",
]);

export const jobStatusSchema = z.enum([
  "queued",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
]);

export const workerJobSchema = z.object({
  id: z.string().uuid(),
  type: jobTypeSchema,
  status: jobStatusSchema,
  payload: z.record(z.string(), z.unknown()).default({}),
  attempts: z.number().int().min(0).default(0),
  maxAttempts: z.number().int().min(1).default(3),
});

export type AppRole = z.infer<typeof appRoleSchema>;
export type JobType = z.infer<typeof jobTypeSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type WorkerJob = z.infer<typeof workerJobSchema>;
