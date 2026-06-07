import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { renderMockupImage } from "./renderer.js";

describe("renderMockupImage", () => {
  it("composites a logo and watermark into a PNG", async () => {
    const base = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 4,
        background: { r: 245, g: 245, b: 245, alpha: 1 },
      },
    }).png().toBuffer();
    const logo = await sharp({
      create: {
        width: 120,
        height: 60,
        channels: 4,
        background: { r: 15, g: 118, b: 110, alpha: 1 },
      },
    }).png().toBuffer();
    const output = await renderMockupImage({
      base,
      logo,
      placement: { x: 25, y: 25, width: 40, height: 30, rotation: 0 },
      watermarkText: "Demo watermark",
    });
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(400);
    expect(metadata.height).toBe(300);
  });
});
