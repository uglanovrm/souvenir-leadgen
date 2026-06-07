import { getRuntimeMockupManager } from "../../../lib/runtime-mockups";
import { createRuntimeMockupTemplateAction } from "./actions";

const statuses = ["draft", "certified", "rejected"];

export default async function RuntimeMockupTemplatesPage() {
  const manager = await getRuntimeMockupManager();
  const disabled = !manager.canManage || manager.source !== "supabase";

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Runtime mockups</p>
          <h1>Mockup pack manager</h1>
        </div>
        <div className="toolbar">
          <span className={manager.source === "supabase" ? "pill active" : "pill"}>{manager.source}</span>
          <span className="pill">{manager.canManage ? "manage" : "read-only"}</span>
        </div>
      </div>

      {manager.warning ? <div className="status">{manager.warning}</div> : null}

      <section className="card stack">
        <h2>Create runtime pack</h2>
        <form action={createRuntimeMockupTemplateAction} className="stack">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="sourceId">PSD source</label>
              <select id="sourceId" name="sourceId" disabled={disabled}>
                <option value="">No source</option>
                {manager.sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="productPackageId">Product package</label>
              <select id="productPackageId" name="productPackageId" disabled={disabled}>
                <option value="">No package</option>
                {manager.packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="productType">Product type</label>
              <input id="productType" name="productType" required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="technology">Technology</label>
              <input id="technology" name="technology" required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="tags">Tags</label>
              <input id="tags" name="tags" placeholder="hr, education" disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="qualityScore">Quality score</label>
              <input id="qualityScore" name="qualityScore" type="number" min="0" max="100" defaultValue="0" disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue="draft" disabled={disabled}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="base">base.png</label>
              <input id="base" name="base" type="file" accept="image/png" required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="preview">preview.jpg</label>
              <input id="preview" name="preview" type="file" accept="image/jpeg,image/png" required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="mask">mask.png</label>
              <input id="mask" name="mask" type="file" accept="image/png" disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="shadow">shadow.png</label>
              <input id="shadow" name="shadow" type="file" accept="image/png" disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="highlight">highlight.png</label>
              <input id="highlight" name="highlight" type="file" accept="image/png" disabled={disabled} />
            </div>
          </div>

          <div className="form-grid">
            <div className="field"><label htmlFor="safeAreaX">Safe X %</label><input id="safeAreaX" name="safeAreaX" type="number" min="0" defaultValue="35" disabled={disabled} /></div>
            <div className="field"><label htmlFor="safeAreaY">Safe Y %</label><input id="safeAreaY" name="safeAreaY" type="number" min="0" defaultValue="25" disabled={disabled} /></div>
            <div className="field"><label htmlFor="safeAreaWidth">Safe W %</label><input id="safeAreaWidth" name="safeAreaWidth" type="number" min="1" defaultValue="30" disabled={disabled} /></div>
            <div className="field"><label htmlFor="safeAreaHeight">Safe H %</label><input id="safeAreaHeight" name="safeAreaHeight" type="number" min="1" defaultValue="30" disabled={disabled} /></div>
            <div className="field"><label htmlFor="placementX">Place X %</label><input id="placementX" name="placementX" type="number" min="0" defaultValue="35" disabled={disabled} /></div>
            <div className="field"><label htmlFor="placementY">Place Y %</label><input id="placementY" name="placementY" type="number" min="0" defaultValue="25" disabled={disabled} /></div>
            <div className="field"><label htmlFor="placementWidth">Place W %</label><input id="placementWidth" name="placementWidth" type="number" min="1" defaultValue="30" disabled={disabled} /></div>
            <div className="field"><label htmlFor="placementHeight">Place H %</label><input id="placementHeight" name="placementHeight" type="number" min="1" defaultValue="30" disabled={disabled} /></div>
            <div className="field"><label htmlFor="placementRotation">Rotation</label><input id="placementRotation" name="placementRotation" type="number" defaultValue="0" disabled={disabled} /></div>
          </div>

          <label className="toolbar">
            <input name="isActive" type="checkbox" defaultChecked disabled={disabled} />
            Active
          </label>
          <button className="button" type="submit" disabled={disabled}>
            Create runtime pack
          </button>
        </form>
      </section>

      <section className="grid" aria-label="Runtime mockup templates">
        {manager.templates.map((template) => (
          <article className="card stack" key={template.id}>
            <div>
              <h2>{template.name}</h2>
              <p>{template.templateBucket}/{template.templatePrefix}</p>
            </div>
            <div className="mockup-preview">
              {template.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={template.previewUrl} alt="" />
              ) : (
                <div className="mockup-placeholder">Preview unavailable in demo mode</div>
              )}
              <span
                className="safe-area-box"
                style={{
                  left: `${template.safeArea.x}%`,
                  top: `${template.safeArea.y}%`,
                  width: `${template.safeArea.width}%`,
                  height: `${template.safeArea.height}%`,
                }}
              />
              <span
                className="placement-box"
                style={{
                  left: `${template.placement.x}%`,
                  top: `${template.placement.y}%`,
                  width: `${template.placement.width}%`,
                  height: `${template.placement.height}%`,
                  transform: `rotate(${template.placement.rotation}deg)`,
                }}
              />
            </div>
            <div className="toolbar">
              <span className={template.status === "certified" ? "pill active" : "pill"}>{template.status}</span>
              <span className={template.isActive ? "pill active" : "pill"}>{template.isActive ? "active" : "inactive"}</span>
              <span className="pill">{template.productType || "no product type"}</span>
              <span className="pill">{template.technology || "no technology"}</span>
              <span className="pill">quality {template.qualityScore}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
