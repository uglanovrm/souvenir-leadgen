import { getMockupSourceLibrary } from "../../../lib/mockup-sources";
import { linkRuntimeTemplateSourceAction, updateMockupSourceAction, uploadMockupSourceAction } from "./actions";

const statuses = ["draft", "normalized", "certified", "rejected"];

export default async function MockupSourcesPage() {
  const library = await getMockupSourceLibrary();
  const disabled = !library.canManage || library.source !== "supabase";

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Prototype sources</p>
          <h1>PSD source library</h1>
        </div>
        <div className="toolbar">
          <span className={library.source === "supabase" ? "pill active" : "pill"}>{library.source}</span>
          <span className="pill">{library.canManage ? "manage" : "read-only"}</span>
        </div>
      </div>

      {library.warning ? <div className="status">{library.warning}</div> : null}

      <section className="card stack">
        <h2>Upload source.psd</h2>
        <form action={uploadMockupSourceAction} className="stack">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="source">PSD file</label>
              <input id="source" name="source" type="file" accept=".psd,application/octet-stream" required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="author">Author</label>
              <input id="author" name="author" disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="license">License</label>
              <input id="license" name="license" disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue="draft" disabled={disabled}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" disabled={disabled} />
          </div>
          <button className="button" type="submit" disabled={disabled}>
            Upload PSD
          </button>
        </form>
      </section>

      <section className="grid" aria-label="PSD sources">
        {library.sources.map((source) => (
          <article className="card stack" key={source.id}>
            <div>
              <h2>{source.name}</h2>
              <p>{source.sourceBucket}/{source.sourcePath}</p>
            </div>
            <div className="toolbar">
              <span className={source.status === "certified" ? "pill active" : "pill"}>{source.status}</span>
              <span className="pill">{source.sourceKind}</span>
            </div>
            <form action={updateMockupSourceAction.bind(null, source.id)} className="stack">
              <div className="form-grid">
                <div className="field">
                  <label htmlFor={`name-${source.id}`}>Name</label>
                  <input id={`name-${source.id}`} name="name" defaultValue={source.name} disabled={disabled} />
                </div>
                <div className="field">
                  <label htmlFor={`status-${source.id}`}>Status</label>
                  <select id={`status-${source.id}`} name="status" defaultValue={source.status} disabled={disabled}>
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`author-${source.id}`}>Author</label>
                  <input id={`author-${source.id}`} name="author" defaultValue={source.author ?? ""} disabled={disabled} />
                </div>
                <div className="field">
                  <label htmlFor={`license-${source.id}`}>License</label>
                  <input id={`license-${source.id}`} name="license" defaultValue={source.license ?? ""} disabled={disabled} />
                </div>
              </div>
              <div className="field">
                <label htmlFor={`notes-${source.id}`}>Notes</label>
                <textarea id={`notes-${source.id}`} name="notes" defaultValue={source.notes ?? ""} disabled={disabled} />
              </div>
              <button className="button secondary" type="submit" disabled={disabled}>
                Save source
              </button>
            </form>
          </article>
        ))}
      </section>

      <section className="card stack">
        <h2>Runtime template links</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Template</th>
              <th>Prefix</th>
              <th>PSD source</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {library.templates.map((template) => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.templatePrefix}</td>
                <td>
                  <form id={`link-${template.id}`} action={linkRuntimeTemplateSourceAction.bind(null, template.id)}>
                    <select name="sourceId" defaultValue={template.sourceId ?? ""} disabled={disabled}>
                      <option value="">No source</option>
                      {library.sources.map((source) => (
                        <option key={source.id} value={source.id}>{source.name}</option>
                      ))}
                    </select>
                  </form>
                </td>
                <td>
                  <button className="button secondary" type="submit" form={`link-${template.id}`} disabled={disabled}>
                    Link source
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
