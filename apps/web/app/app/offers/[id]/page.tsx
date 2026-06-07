import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommercialHandoff } from "../../../../lib/commercial-handoff";
import { getOfferEditor } from "../../../../lib/offers";
import {
  approveOfferAction,
  createDealFromOfferAction,
  enqueueOfferPdfExportAction,
  exportOfferHtmlAction,
  prepareOfferMessageAction,
  saveOfferDraftAction,
} from "./actions";

type OfferEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfferEditorPage({ params }: OfferEditorPageProps) {
  const { id } = await params;
  const view = await getOfferEditor(id);
  const handoff = await getCommercialHandoff(id);

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

          <section className="card stack">
            <h2>Commercial handoff</h2>
            <div className="toolbar">
              <span className={handoff.offer.status === "approved" ? "pill active" : "pill"}>{handoff.offer.status}</span>
              <span className="pill">approved prototypes {handoff.approvedPrototypeCount}</span>
              <span className="pill">manual send only</span>
            </div>

            <div className="toolbar">
              <button
                className="button secondary"
                formAction={exportOfferHtmlAction.bind(null, offer.id)}
                formNoValidate
                type="submit"
                disabled={disabled || handoff.offer.status !== "approved"}
              >
                Export HTML
              </button>
              <button
                className="button secondary"
                formAction={enqueueOfferPdfExportAction.bind(null, offer.id)}
                formNoValidate
                type="submit"
                disabled={disabled || handoff.offer.status !== "approved"}
              >
                Queue PDF
              </button>
              <button
                className="button secondary"
                formAction={prepareOfferMessageAction.bind(null, offer.id)}
                formNoValidate
                type="submit"
                disabled={disabled || handoff.offer.status !== "approved"}
              >
                Prepare message
              </button>
              <button
                className="button"
                formAction={createDealFromOfferAction.bind(null, offer.id)}
                formNoValidate
                type="submit"
                disabled={disabled || !handoff.canManage || handoff.offer.status !== "approved"}
              >
                Create deal
              </button>
            </div>

            <div className="handoff-list">
              <div>
                <strong>Exports</strong>
                {handoff.exports.length === 0 ? <p className="table-note">No exports yet.</p> : null}
                {handoff.exports.map((item) => (
                  <p className="table-note" key={item.id}>
                    {item.kind}: {item.url ? <a href={item.url}>{item.storagePath}</a> : item.storagePath}
                  </p>
                ))}
              </div>
              <div>
                <strong>Messages</strong>
                {handoff.messages.length === 0 ? <p className="table-note">No prepared messages yet.</p> : null}
                {handoff.messages.map((message) => (
                  <p className="table-note" key={message.id}>
                    {message.status}: {message.subject} / attachments {message.attachmentCount} / {message.manualSendRequired ? "manual gate" : "review gate"}
                  </p>
                ))}
              </div>
              <div>
                <strong>Deals</strong>
                {handoff.deals.length === 0 ? <p className="table-note">No deals yet.</p> : null}
                {handoff.deals.map((deal) => (
                  <p className="table-note" key={deal.id}>
                    {deal.status}: amount {deal.amount}, margin {deal.margin}, commission {deal.commissionAmount} at {deal.commissionRate}%
                  </p>
                ))}
              </div>
            </div>
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
