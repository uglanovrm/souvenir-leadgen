import { describe, expect, it } from "vitest";
import { selectMockupTemplates } from "./template-selector.js";

const brief = {
  productType: "mug",
  technology: "UV print",
  industryTags: ["education", "hr"],
  logoAspectRatio: 1.5,
};

describe("selectMockupTemplates", () => {
  it("returns ranked active templates with explanations", () => {
    const [top] = selectMockupTemplates(brief, [
      {
        id: "good",
        name: "Good mug",
        isActive: true,
        productType: "mug",
        technology: "UV print",
        tags: ["education"],
        qualityScore: 90,
        placementAspectRatio: 1.4,
      },
      {
        id: "weak",
        name: "Weak bottle",
        isActive: true,
        productType: "bottle",
        technology: "Laser",
        tags: [],
        qualityScore: 40,
        placementAspectRatio: 4,
      },
    ]);

    expect(top?.id).toBe("good");
    expect(top?.rank).toBe(1);
    expect(top?.explanation).toContain("product type match");
  });

  it("excludes inactive templates and penalizes poor aspect ratio", () => {
    const ranked = selectMockupTemplates(brief, [
      {
        id: "inactive",
        name: "Inactive good mug",
        isActive: false,
        productType: "mug",
        technology: "UV print",
        tags: ["education"],
        qualityScore: 100,
        placementAspectRatio: 1.5,
      },
      {
        id: "wide",
        name: "Wide placement",
        isActive: true,
        productType: "mug",
        technology: "UV print",
        tags: ["education"],
        qualityScore: 100,
        placementAspectRatio: 8,
      },
    ]);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.id).toBe("wide");
    expect(ranked[0]?.explanation).toContain("logo aspect is poor");
  });
});
