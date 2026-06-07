import { describe, expect, it } from "vitest";
import { StubProvider } from "./llm/stub.js";
import { buildOfferContext, generateDraftOffer } from "./offers.js";

const leadId = "00000000-0000-4000-8000-000000000501";
const packageId = "00000000-0000-4000-8000-000000000101";
const assetId = "00000000-0000-4000-8000-000000000601";

type TableName = "campaign_leads" | "product_packages" | "portfolio_assets" | "offers" | "offer_assets";

class FakeQuery {
  constructor(
    private readonly db: FakeSupabase,
    private readonly table: TableName,
    private readonly mode: "select" | "insert",
    private readonly insertValue?: unknown,
  ) {}

  select() {
    return this;
  }

  eq() {
    return this;
  }

  in() {
    return this;
  }

  order() {
    return this;
  }

  limit() {
    return this;
  }

  async maybeSingle() {
    return { data: this.db.rows[this.table][0] ?? null, error: null };
  }

  async single() {
    if (this.mode === "insert" && this.table === "offers") {
      const row = { ...(this.insertValue as Record<string, unknown>), id: "00000000-0000-4000-8000-000000000701" };
      this.db.insertedOffers.push(row);
      return { data: { id: row.id }, error: null };
    }

    return { data: this.db.rows[this.table][0] ?? null, error: null };
  }

  then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
    return Promise.resolve({ data: this.db.rows[this.table], error: null }).then(resolve);
  }
}

class FakeSupabase {
  insertedOffers: Record<string, unknown>[] = [];
  insertedOfferAssets: unknown[] = [];

  rows: Record<TableName, unknown[]> = {
    campaign_leads: [{
      id: leadId,
      status: "new",
      score: 75,
      evidence: { source: "csv" },
      campaign: {
        id: "00000000-0000-4000-8000-000000000201",
        name: "Demo HR onboarding leads",
        description: "Demo campaign",
        target_industries: ["hr"],
      },
      organization: {
        id: "00000000-0000-4000-8000-000000000401",
        name: "Acme Education",
        website: "https://acme.example",
        industry: "education",
        city: "Moscow",
        notes: null,
      },
      contact: {
        id: "00000000-0000-4000-8000-000000000402",
        full_name: "Ivan Ivanov",
        role_title: "HR lead",
        email: "ivan@example.com",
      },
    }],
    product_packages: [{
      id: packageId,
      name: "Welcome merch starter pack",
      slug: "welcome-merch-starter-pack",
      description: "Mug, sticker sheet, and notebook.",
      technology: "UV print and digital transfer",
      min_quantity: 50,
      price_from: 790,
      production_days: 7,
      target_industries: ["hr", "education"],
    }],
    portfolio_assets: [{
      id: assetId,
      package_id: packageId,
      title: "Demo mug",
      storage_bucket: "portfolio-assets",
      storage_path: "demo/mug.png",
      allowed_for_offer: true,
      metadata: { industry: "education" },
    }],
    offers: [],
    offer_assets: [],
  };

  from(table: TableName) {
    return {
      select: () => new FakeQuery(this, table, "select"),
      insert: (value: unknown) => {
        if (table === "offer_assets") {
          this.insertedOfferAssets.push(value);
          return Promise.resolve({ data: null, error: null });
        }

        return new FakeQuery(this, table, "insert", value);
      },
    };
  }
}

describe("offer generation", () => {
  it("adds a warning when lead evidence has no Avito link", async () => {
    const context = await buildOfferContext(new FakeSupabase() as never, {
      campaignLeadId: leadId,
      selectedPackageIds: [packageId],
      selectedPortfolioAssetIds: [assetId],
    });

    expect(context.warnings).toContain("Missing Avito link in lead evidence.");
  });

  it("validates LLM output and creates a draft offer row", async () => {
    const db = new FakeSupabase();
    const provider = new StubProvider([
      JSON.stringify({
        title: "Welcome merch for Acme Education",
        summary: "A starter welcome merch package based on the selected catalog item.",
        body: "Offer Acme Education the welcome merch starter pack with the known minimum quantity, price, and production days from the catalog context.",
        selectedPackageIds: [packageId],
        selectedPortfolioAssetIds: [assetId],
        warnings: [],
        confidence: 0.82,
        sourceIdsUsed: [leadId, packageId, assetId],
      }),
    ]);

    const result = await generateDraftOffer(db as never, provider, {
      campaignLeadId: leadId,
      selectedPackageIds: [packageId],
      selectedPortfolioAssetIds: [assetId],
    });

    expect(result.offerId).toBe("00000000-0000-4000-8000-000000000701");
    expect(result.draft.warnings).toContain("Missing Avito link in lead evidence.");
    expect(db.insertedOffers[0]).toMatchObject({
      campaign_lead_id: leadId,
      product_package_id: packageId,
      status: "draft",
      title: "Welcome merch for Acme Education",
    });
    expect(db.insertedOfferAssets).toHaveLength(1);
  });

  it("rejects package ids invented outside the DB context", async () => {
    const provider = new StubProvider([
      JSON.stringify({
        title: "Invalid package",
        summary: "This response attempts to use a package that is not in context.",
        body: "The worker should reject this draft before inserting anything into the database.",
        selectedPackageIds: ["00000000-0000-4000-8000-000000009999"],
        selectedPortfolioAssetIds: [],
        warnings: [],
        confidence: 0.7,
        sourceIdsUsed: [leadId],
      }),
    ]);

    await expect(generateDraftOffer(new FakeSupabase() as never, provider, {
      campaignLeadId: leadId,
      selectedPackageIds: [packageId],
      selectedPortfolioAssetIds: [],
    })).rejects.toThrow("Offer draft selected package outside context");
  });
});
