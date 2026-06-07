import Image from "next/image";
import { getPrototypeStudioView } from "../../../lib/prototype-studio";
import {
  approvePrototypeLogoAction,
  approvePrototypeRenderAction,
  enqueuePrototypeRerenderAction,
  rejectPrototypeRenderAction,
  switchPrototypeTemplateAction,
} from "./actions";

export default async function PrototypeStudioPage() {
  const view = await getPrototypeStudioView();
  const disabled = view.source !== "supabase" || !view.canManage;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Prototype Studio</p>
          <h1>Prototype approval</h1>
        </div>
        <div className="toolbar">
          <span className={view.source === "supabase" ? "pill active" : "pill"}>{view.source}</span>
          {view.activeBrief ? <span className="pill">{view.activeBrief.status}</span> : null}
        </div>
      </div>

      {view.warning ? <div className="status">{view.warning}</div> : null}

      <div className="studio-layout">
        <main className="stack">
          <section className="card stack">
            <h2>Approval context</h2>
            {view.activeBrief ? (
              <div className="toolbar">
                <span className="pill">{view.activeBrief.offerTitle}</span>
                <span className="pill">{view.activeBrief.organizationName}</span>
                <span className="pill">{view.brief.productType}</span>
                <span className="pill">{view.brief.technology}</span>
                {view.brief.industryTags.map((tag) => <span className="pill" key={tag}>{tag}</span>)}
                <span className="pill">logo aspect {view.brief.logoAspectRatio ?? "unknown"}</span>
              </div>
            ) : (
              <p>No prototype brief exists yet.</p>
            )}
          </section>

          <section className="card stack">
            <div className="toolbar between">
              <h2>Generated mockups</h2>
              {view.activeBrief ? (
                <form action={enqueuePrototypeRerenderAction}>
                  <input type="hidden" name="briefId" value={view.activeBrief.id} />
                  <button className="button secondary" type="submit" disabled={disabled}>
                    Rerender
                  </button>
                </form>
              ) : null}
            </div>

            {view.renders.length === 0 ? <p>No generated mockups yet.</p> : null}

            <div className="grid">
              {view.renders.map((render) => (
                <article className="preview-tile" key={render.id}>
                  <div className="preview-frame">
                    {render.imageUrl ? <Image src={render.imageUrl} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" unoptimized /> : <span>Preview unavailable</span>}
                  </div>
                  <div className="stack compact">
                    <div className="toolbar">
                      <span className={render.status === "approved" ? "pill active" : "pill"}>{render.status}</span>
                      <span className="pill">QC {render.qcScore ?? "pending"}</span>
                      {render.templateProductType ? <span className="pill">{render.templateProductType}</span> : null}
                    </div>
                    {render.qcWarnings.length > 0 ? (
                      <ul className="warning-list">
                        {render.qcWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                      </ul>
                    ) : (
                      <p>No QC warnings.</p>
                    )}
                    <div className="toolbar">
                      <form action={approvePrototypeRenderAction}>
                        <input type="hidden" name="id" value={render.id} />
                        <button className="button" type="submit" disabled={disabled || render.status === "rejected"}>
                          Approve
                        </button>
                      </form>
                      <form action={rejectPrototypeRenderAction}>
                        <input type="hidden" name="id" value={render.id} />
                        <button className="button secondary" type="submit" disabled={disabled || render.status === "approved"}>
                          Reject
                        </button>
                      </form>
                    </div>
                    <p>Offer asset: {render.finalOfferEligible ? "linked after approval" : "not eligible"}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="stack">
          <section className="card stack">
            <h2>Company logos</h2>
            {view.logos.map((logo) => (
              <form className="approval-row" action={approvePrototypeLogoAction} key={logo.id}>
                <input type="hidden" name="id" value={logo.id} />
                <input type="hidden" name="organizationId" value={logo.organizationId ?? ""} />
                <div className="preview-thumb">
                  {logo.imageUrl ? <Image src={logo.imageUrl} alt="" fill sizes="72px" unoptimized /> : <span>No image</span>}
                </div>
                <div>
                  <strong>{logo.organizationName}</strong>
                  <p className="table-note">{logo.status} / score {logo.qualityScore}</p>
                  {logo.warnings.length > 0 ? <p className="table-note">{logo.warnings.join("; ")}</p> : null}
                </div>
                <button className="button secondary" type="submit" disabled={disabled || logo.status === "approved"}>
                  Approve
                </button>
              </form>
            ))}
          </section>

          <section className="card stack">
            <h2>Selected templates</h2>
            {view.rankedTemplates.map((template) => (
              <form className="approval-row" action={switchPrototypeTemplateAction} key={template.id}>
                <input type="hidden" name="briefId" value={view.activeBrief?.id ?? ""} />
                <input type="hidden" name="templateId" value={template.id} />
                <div>
                  <strong>{template.rank}. {template.name}</strong>
                  <p className="table-note">{template.productType} / {template.technology} / score {template.score}</p>
                  <p className="table-note">{template.explanation}</p>
                </div>
                <button className="button secondary" type="submit" disabled={disabled || !view.activeBrief || view.activeBrief.selectedTemplateId === template.id}>
                  Switch
                </button>
              </form>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
