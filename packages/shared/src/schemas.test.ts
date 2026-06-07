import { describe, expect, it } from "vitest";
import { appRoleSchema, campaignFormSchema, csvLeadRowSchema, mockupSourceFormSchema, portfolioAssetFormSchema, productPackageFormSchema, workerJobSchema } from "./schemas.js";

describe("shared schemas", () => {
  it("accepts supported application roles", () => {
    expect(appRoleSchema.parse("admin")).toBe("admin");
    expect(appRoleSchema.parse("agent")).toBe("agent");
  });

  it("validates a queued worker job", () => {
    const job = workerJobSchema.parse({
      id: "00000000-0000-4000-8000-000000000001",
      type: "lead.score",
      status: "queued",
    });

    expect(job.payload).toEqual({});
    expect(job.maxAttempts).toBe(3);
  });

  it("validates product package form input", () => {
    const input = productPackageFormSchema.parse({
      name: "Welcome Pack",
      slug: "welcome-pack",
      technology: "UV print",
      minQuantity: 50,
      priceFrom: 790,
      productionDays: 7,
    });

    expect(input.targetIndustries).toBe("");
  });

  it("validates portfolio asset metadata", () => {
    const input = portfolioAssetFormSchema.parse({
      title: "Mug photo",
      qualityScore: 82,
      allowedForOffer: true,
    });

    expect(input.qualityScore).toBe(82);
    expect(input.allowedForOffer).toBe(true);
  });

  it("validates campaign and CSV lead inputs", () => {
    expect(campaignFormSchema.parse({ name: "June HR" }).targetIndustries).toBe("");
    expect(csvLeadRowSchema.parse({ name: "Acme", website: "https://acme.test" }).name).toBe("Acme");
  });

  it("validates mockup source lifecycle metadata", () => {
    const input = mockupSourceFormSchema.parse({
      name: "Mug source PSD",
      status: "certified",
      author: "Internal",
      license: "Owned",
    });

    expect(input.status).toBe("certified");
    expect(input.notes).toBe("");
  });
});
