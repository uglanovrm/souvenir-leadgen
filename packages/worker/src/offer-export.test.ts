import { describe, expect, it } from "vitest";
import { renderSimplePdf } from "./offer-export.js";

describe("renderSimplePdf", () => {
  it("creates a minimal PDF buffer without leaking unescaped parentheses", () => {
    const pdf = renderSimplePdf("Offer (manual)", ["Line with (details)", "Automatic send blocked"]);
    const text = pdf.toString("latin1");

    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("xref");
    expect(text).toContain("Offer \\(manual\\)");
    expect(text).toContain("Automatic send blocked");
  });
});
