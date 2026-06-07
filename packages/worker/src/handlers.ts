import type { WorkerJob } from "@souvenir-leadgen/shared";
import { z } from "zod";
import { generateJson, type CompletionProvider } from "./llm/generate-json.js";

export type JobResult = {
  summary: string;
  details?: Record<string, unknown>;
};

const offerGenerateSchema = z.object({
  warnings: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  source_ids_used: z.array(z.string()),
});

export async function handleJob(job: WorkerJob, llmProvider?: CompletionProvider): Promise<JobResult> {
  switch (job.type) {
    case "lead.import":
    case "lead.classify":
    case "lead.score":
    case "offer.generate": {
      if (!llmProvider) {
        throw new Error("LM Studio provider is not configured for offer.generate.");
      }

      const result = await generateJson(
        llmProvider,
        offerGenerateSchema,
        [
          "Generate a safe offer draft planning object from this DB context.",
          "Return JSON with warnings, confidence, explanation, source_ids_used.",
          "Do not invent prices, deadlines, discounts, or capabilities.",
          JSON.stringify(job.payload),
        ].join("\n\n"),
      );

      return {
        summary: "offer.generate validated by local LM Studio provider",
        details: result,
      };
    }
    case "prototype.create_brief":
    case "prototype.render":
    case "prototype.qc":
    case "offer.render_html":
    case "offer.render_pdf":
    case "message.prepare":
      return {
        summary: `${job.type} accepted by local worker stub`,
        details: {
          safe_stub: true,
          outbound_sent: false,
        },
      };
  }
}
