import { describe, expect, it } from "vitest";
import { appRoleSchema, workerJobSchema } from "./schemas.js";

describe("shared schemas", () => {
  it("accepts supported application roles", () => {
    expect(appRoleSchema.parse("admin")).toBe("admin");
    expect(appRoleSchema.parse("agent")).toBe("agent");
  });

  it("validates a queued worker job", () => {
    const job = workerJobSchema.parse({
      id: "00000000-0000-4000-8000-000000000001",
      type: "score_lead",
      status: "queued",
    });

    expect(job.payload).toEqual({});
    expect(job.maxAttempts).toBe(3);
  });
});
