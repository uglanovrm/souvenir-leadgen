import { getBrandAssetLibrary } from "../../../lib/brand-assets";
import { approveBrandLogoAction, rejectBrandLogoAction, uploadBrandLogoAction } from "./actions";

export default async function BrandAssetsPage() {
  const library = await getBrandAssetLibrary();
  const disabled = !library.canManage || library.source !== "supabase";

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Brand assets</p>
          <h1>Company logos</h1>
        </div>
        <div className="toolbar">
          <span className={library.source === "supabase" ? "pill active" : "pill"}>{library.source}</span>
          <span className="pill">{library.canManage ? "manage" : "read-only"}</span>
        </div>
      </div>

      {library.warning ? <div className="status">{library.warning}</div> : null}

      <section className="card stack">
        <h2>Upload logo candidate</h2>
        <form action={uploadBrandLogoAction} className="stack">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="organizationId">Organization</label>
              <select id="organizationId" name="organizationId" required disabled={disabled}>
                {library.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="logo">Logo file</label>
              <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/svg+xml,.svg" required disabled={disabled} />
            </div>
          </div>
          <button className="button" type="submit" disabled={disabled}>
            Upload and score
          </button>
        </form>
      </section>

      <section className="grid" aria-label="Logo candidates">
        {library.logos.map((logo) => (
          <article className="card stack" key={logo.id}>
            <div>
              <h2>{logo.organizationName}</h2>
              <p>{logo.originalPath}</p>
            </div>
            {logo.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.imageUrl} alt="" style={{ borderRadius: 6, maxWidth: "100%" }} />
            ) : (
              <div className="status">Logo preview unavailable in demo mode.</div>
            )}
            <div className="toolbar">
              <span className={logo.status === "approved" ? "pill active" : "pill"}>{logo.status}</span>
              <span className={logo.metadata.renderBlocked ? "pill danger" : "pill active"}>score {logo.qualityScore}</span>
              <span className="pill">{logo.metadata.mimeType ?? "unknown type"}</span>
              <span className="pill">{logo.metadata.width ?? "?"}x{logo.metadata.height ?? "?"}</span>
              <span className={logo.metadata.hasAlpha ? "pill active" : "pill"}>{logo.metadata.hasAlpha ? "alpha" : "opaque"}</span>
            </div>
            {logo.warnings.length > 0 ? (
              <div className="status">
                {logo.warnings.join(" ")}
              </div>
            ) : null}
            {logo.metadata.renderBlocked ? (
              <div className="status">Automatic render is blocked until a higher quality logo is approved.</div>
            ) : null}
            <div className="toolbar">
              <form action={approveBrandLogoAction}>
                <input type="hidden" name="id" value={logo.id} />
                <input type="hidden" name="organizationId" value={logo.organizationId ?? ""} />
                <button className="button secondary" type="submit" disabled={disabled}>
                  Approve
                </button>
              </form>
              <form action={rejectBrandLogoAction}>
                <input type="hidden" name="id" value={logo.id} />
                <button className="button secondary" type="submit" disabled={disabled}>
                  Reject
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
