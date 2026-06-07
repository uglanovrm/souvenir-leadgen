import { z } from "zod";

export const appRoleSchema = z.enum(["admin", "producer", "agent", "manager"]);

export const jobTypeSchema = z.enum([
  "lead.import",
  "lead.classify",
  "lead.score",
  "offer.generate",
  "prototype.create_brief",
  "prototype.render",
  "prototype.qc",
  "offer.render_html",
  "offer.render_pdf",
  "message.prepare",
]);

export const jobStatusSchema = z.enum([
  "queued",
  "running",
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

export const productPackageFormSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(2000).default(""),
  technology: z.string().trim().min(2),
  minQuantity: z.number().int().min(1),
  priceFrom: z.number().min(0),
  productionDays: z.number().int().min(1),
  targetIndustries: z.string().trim().default(""),
  marginPercent: z.number().min(0).default(0),
});

export const portfolioAssetFormSchema = z.object({
  title: z.string().trim().min(2),
  packageId: z.string().uuid().optional().or(z.literal("")),
  technology: z.string().trim().default(""),
  industry: z.string().trim().default(""),
  productType: z.string().trim().default(""),
  material: z.string().trim().default(""),
  qualityScore: z.number().min(0).max(100).default(0),
  allowedForOffer: z.boolean().default(false),
});

export type AppRole = z.infer<typeof appRoleSchema>;
export type JobType = z.infer<typeof jobTypeSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type WorkerJob = z.infer<typeof workerJobSchema>;
export type ProductPackageFormInput = z.infer<typeof productPackageFormSchema>;
export type PortfolioAssetFormInput = z.infer<typeof portfolioAssetFormSchema>;
