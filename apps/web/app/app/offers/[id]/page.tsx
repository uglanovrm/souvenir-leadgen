import Link from "next/link";
import { notFound } from "next/navigation";
import { getOfferEditor } from "../../../../lib/offers";
import { approveOfferAction, saveOfferDraftAction } from "./actions";

type OfferEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfferEditorPage({ params }: OfferEditorPageProps) {
  const { id } = await params;
  const view = await getOfferEditor(id);

  if (!view.offer) {
    notFound();
  }

  const offer = view.offer;
  const disabled = view.source !== "supabase";

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Offer Studio</p>
          <h1>{offer.title}</h1>
        </div>
        <Link className="button secondary" href="/app/offers">
          Back
        </Link>
      </div>

      {view.warning ? <div className="status">{view.warning}</div> : null}

      <form className="studio-layout" action={saveOfferDraftAction.bind(null, offer.id)}>
        <section className="card stack">
          <div className="toolbar">
            <span className={offer.status === "approved" ? "pill active" : "pill"}>{offer.status}</span>
            <span className="pill">{offer.organizationName}</span>
          </div>

          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" defaultValue={offer.title} required disabled={disabled} />
          </div>

          <div className="field">
            <label htmlFor="summary">Summary</label>
            <textarea id="summary" name="summary" defaultValue={offer.summary} required disabled={disabled} />
          </div>

          <div className="field">
            <label htmlFor="body">Offer text</label>
            <textarea className="offer-body" id="body" name="body" defaultValue={offer.body} required disabled={disabled} />
          </div>
        </section>

        <aside className="stack">
          <section className="card stack">
            <h2>Package</h2>
            <div className="field">
              <label htmlFor="productPackageId">Selected package</label>
              <select id="productPackageId" name="productPackageId" defaultValue={offer.productPackageId} required disabled={disabled}>
                {offer.packages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - from {item.priceFrom} / {item.productionDays} days
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="card stack">
            <h2>Portfolio assets</h2>
            <div className="check-list">
              {offer.portfolioAssets.map((asset) => (
                <label key={asset.id} className="check-row">
                  <input
                    type="checkbox"
                    name="portfolioAssetIds"
                    value={asset.id}
                    defaultChecked={offer.selectedPortfolioAssetIds.includes(asset.id)}
                    disabled={disabled}
                  />
                  <span>{asset.title}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="card stack">
            <h2>Warnings</h2>
            <div className="field">
              <label htmlFor="warnings">One warning per line</label>
              <textarea id="warnings" name="warnings" defaultValue={offer.warnings.join("\n")} disabled={disabled} />
            </div>
            {offer.warnings.length > 0 ? (
              <label className="check-row warning-accept">
                <input type="checkbox" name="warningsAccepted" disabled={disabled} />
                <span>Accept warnings for approval</span>
              </label>
            ) : null}
          </section>

          <section className="toolbar">
            <button className="button secondary" type="submit" disabled={disabled}>
              Save draft
            </button>
            <button className="button" formAction={approveOfferAction.bind(null, offer.id)} type="submit" disabled={disabled}>
              Approve
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}
