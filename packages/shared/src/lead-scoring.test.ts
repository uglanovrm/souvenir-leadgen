import { describe, expect, it } from "vitest";
import { scoreLead } from "./lead-scoring.js";

describe("scoreLead", () => {
  it("scores a strong lead as eligible", () => {
    const result = scoreLead({
      industry: "hr",
      targetIndustries: ["hr"],
      hasWebsite: true,
      hasLogo: true,
      hasContact: true,
      hasGeo: true,
      hasPortfolioFit: true,
      previouslyContacted: false,
      blocked: false,
    });

    expect(result.score).toBe(100);
    expect(result.eligible).toBe(true);
  });

  it("blocks rejected or stop-list leads", () => {
    const result = scoreLead({
      targetIndustries: [],
      blocked: true,
    });

    expect(result.score).toBe(0);
    expect(result.eligible).toBe(false);
  });
});
