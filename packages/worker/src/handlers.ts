import type { WorkerJob } from "@souvenir-leadgen/shared";

export type JobResult = {
  summary: string;
  details?: Record<string, unknown>;
};

export async function handleJob(job: WorkerJob): Promise<JobResult> {
  switch (job.type) {
    case "lead.import":
    case "lead.classify":
    case "lead.score":
    case "offer.generate":
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
