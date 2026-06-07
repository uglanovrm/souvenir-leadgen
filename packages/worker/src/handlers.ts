import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkerJob } from "@souvenir-leadgen/shared";
import type { CompletionProvider } from "./llm/generate-json.js";
import { generateDraftOffer } from "./offers.js";
import { renderPrototypeJob } from "./renderer.js";

export type JobResult = {
  summary: string;
  details?: Record<string, unknown>;
};

export async function handleJob(
  job: WorkerJob,
  llmProvider?: CompletionProvider,
  supabase?: SupabaseClient,
): Promise<JobResult> {
  switch (job.type) {
    case "lead.import":
    case "lead.classify":
    case "lead.score":
      return {
        summary: `${job.type} accepted by local worker stub`,
        details: {
          safe_stub: true,
          outbound_sent: false,
        },
      };
    case "offer.generate": {
      if (!llmProvider) {
        throw new Error("LM Studio provider is not configured for offer.generate.");
      }

      if (!supabase) {
        throw new Error("Supabase client is required for offer.generate.");
      }

      const result = await generateDraftOffer(supabase, llmProvider, job.payload);

      return {
        summary: "offer.generate created draft offer",
        details: result,
      };
    }
    case "prototype.create_brief":
    case "prototype.render": {
      if (!supabase) {
        throw new Error("Supabase client is required for prototype.render.");
      }

      const result = await renderPrototypeJob(supabase, job.payload);

      return {
        summary: "prototype.render generated watermarked mockups",
        details: result,
      };
    }
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
