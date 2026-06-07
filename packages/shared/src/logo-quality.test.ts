import { describe, expect, it } from "vitest";
import { scoreLogoQuality } from "./logo-quality.js";

describe("scoreLogoQuality", () => {
  it("accepts a transparent high-resolution PNG", () => {
    const result = scoreLogoQuality({
      width: 800,
      height: 400,
      mimeType: "image/png",
      fileSize: 32000,
      hasAlpha: true,
      isSvg: false,
    });

    expect(result.score).toBe(100);
    expect(result.renderBlocked).toBe(false);
  });

  it("blocks tiny opaque raster logos from automatic render", () => {
    const result = scoreLogoQuality({
      width: 120,
      height: 80,
      mimeType: "image/jpeg",
      fileSize: 1200,
      hasAlpha: false,
      isSvg: false,
    });

    expect(result.score).toBeLessThan(60);
    expect(result.renderBlocked).toBe(true);
    expect(result.warnings).toContain("Raster logo has no detected transparency; background removal may be needed.");
  });
});
