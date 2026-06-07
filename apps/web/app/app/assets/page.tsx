import { getAssetLibraryViewModel } from "../../../lib/assets";
import { updatePortfolioAssetAction, uploadPortfolioAssetAction } from "./actions";

export default async function AssetsPage() {
  const library = await getAssetLibraryViewModel();
  const disabled = !library.canManage || library.source !== "supabase";

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h1>Asset library</h1>
        </div>
        <div className="toolbar">
          <span className={library.source === "supabase" ? "pill active" : "pill"}>{library.source}</span>
          <span className="pill">{library.canManage ? "manage" : "read-only"}</span>
        </div>
      </div>

      {library.warning ? <div className="status">{library.warning}</div> : null}

      <section className="card stack">
        <h2>Upload asset</h2>
        <form action={uploadPortfolioAssetAction} className="stack">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="image">Image</label>
              <input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="technology">Technology</label>
              <input id="technology" name="technology" disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="industry">Industry</label>
              <input id="industry" name="industry" disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="productType">Product type</label>
              <input id="productType" name="productType" disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="material">Material</label>
              <input id="material" name="material" disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="qualityScore">Quality score</label>
              <input id="qualityScore" name="qualityScore" type="number" min="0" max="100" defaultValue="0" disabled={disabled} />
            </div>
          </div>
          <label className="toolbar">
            <input name="allowedForOffer" type="checkbox" disabled={disabled} />
            Allowed for offers
          </label>
          <button className="button" type="submit" disabled={disabled}>
            Upload asset
          </button>
        </form>
      </section>

      <section className="grid" aria-label="Portfolio assets">
        {library.assets.map((asset) => (
          <article className="card stack" key={asset.id}>
            <div>
              <h2>{asset.title}</h2>
              <p>{asset.storagePath}</p>
            </div>
            {asset.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.imageUrl} alt="" style={{ borderRadius: 6, maxWidth: "100%" }} />
            ) : (
              <div className="status">Image preview unavailable in demo mode.</div>
            )}
            <div className="toolbar">
              <span className={asset.allowedForOffer ? "pill active" : "pill"}>{asset.allowedForOffer ? "offer-ready" : "internal"}</span>
              <span className="pill">quality {asset.metadata.qualityScore ?? 0}</span>
            </div>
            <form action={updatePortfolioAssetAction.bind(null, asset.id)} className="stack">
              <div className="form-grid">
                <div className="field">
                  <label htmlFor={`title-${asset.id}`}>Title</label>
                  <input id={`title-${asset.id}`} name="title" defaultValue={asset.title} disabled={disabled} />
                </div>
                <div className="field">
                  <label htmlFor={`technology-${asset.id}`}>Technology</label>
                  <input id={`technology-${asset.id}`} name="technology" defaultValue={asset.metadata.technology ?? ""} disabled={disabled} />
                </div>
                <div className="field">
                  <label htmlFor={`industry-${asset.id}`}>Industry</label>
                  <input id={`industry-${asset.id}`} name="industry" defaultValue={asset.metadata.industry ?? ""} disabled={disabled} />
                </div>
                <div className="field">
                  <label htmlFor={`quality-${asset.id}`}>Quality</label>
                  <input id={`quality-${asset.id}`} name="qualityScore" type="number" min="0" max="100" defaultValue={asset.metadata.qualityScore ?? 0} disabled={disabled} />
                </div>
              </div>
              <input name="productType" type="hidden" value={asset.metadata.productType ?? ""} />
              <input name="material" type="hidden" value={asset.metadata.material ?? ""} />
              <input name="packageId" type="hidden" value={asset.packageId ?? ""} />
              <label className="toolbar">
                <input name="allowedForOffer" type="checkbox" defaultChecked={asset.allowedForOffer} disabled={disabled} />
                Allowed for offers
              </label>
              <button className="button secondary" type="submit" disabled={disabled}>
                Save metadata
              </button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
