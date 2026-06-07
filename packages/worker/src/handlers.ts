import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkerJob } from "@souvenir-leadgen/shared";
import type { CompletionProvider } from "./llm/generate-json.js";
import { renderOfferPdfJob } from "./offer-export.js";
import { generateDraftOffer } from "./offers.js";
import { runPrototypeQcJob } from "./prototype-qc.js";
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
    case "prototype.qc": {
      if (!supabase) {
        throw new Error("Supabase client is required for prototype.qc.");
      }

      const result = await runPrototypeQcJob(supabase, job.payload);

      return {
        summary: "prototype.qc scored generated mockups",
        details: result,
      };
    }
    case "offer.render_html":
      return {
        summary: `${job.type} accepted by local worker stub`,
        details: {
          safe_stub: true,
          outbound_sent: false,
        },
      };
    case "offer.render_pdf": {
      if (!supabase) {
        throw new Error("Supabase client is required for offer.render_pdf.");
      }

      const result = await renderOfferPdfJob(supabase, job.payload);

      return {
        summary: "offer.render_pdf exported a manual PDF preview",
        details: result,
      };
    }
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
