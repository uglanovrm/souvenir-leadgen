import { describe, expect, it } from "vitest";
import { scorePrototypeQc } from "./prototype-qc.js";

const baseInput = {
  placement: { x: 20, y: 20, width: 30, height: 24 },
  safeArea: { x: 10, y: 10, width: 70, height: 70 },
  hasWatermark: true,
  contrastStdev: 42,
  templateProductType: "mug",
  briefProductType: "mug",
  duplicateProductType: false,
};

describe("scorePrototypeQc", () => {
  it("passes a render with sane placement, watermark, contrast, and matching template", () => {
    const qc = scorePrototypeQc(baseInput);

    expect(qc.score).toBe(100);
    expect(qc.status).toBe("generated");
    expect(qc.issues).toEqual([]);
  });

  it("rejects overflow, missing watermark, and low contrast together", () => {
    const qc = scorePrototypeQc({
      ...baseInput,
      placement: { x: 75, y: 75, width: 30, height: 24 },
      hasWatermark: false,
      contrastStdev: 8,
    });

    expect(qc.score).toBe(25);
    expect(qc.status).toBe("rejected");
    expect(qc.issues.map((item) => item.code)).toEqual([
      "safe_area_overflow",
      "missing_watermark",
      "low_contrast",
    ]);
  });

  it("penalizes product mismatch and duplicate product type", () => {
    const qc = scorePrototypeQc({
      ...baseInput,
      templateProductType: "hoodie",
      briefProductType: "mug",
      duplicateProductType: true,
    });

    expect(qc.score).toBe(65);
    expect(qc.status).toBe("generated");
    expect(qc.issues.map((item) => item.code)).toEqual(["template_mismatch", "duplicate_product_type"]);
  });
});
