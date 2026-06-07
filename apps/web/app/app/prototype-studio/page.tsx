import { getPrototypeStudioView } from "../../../lib/prototype-studio";

export default async function PrototypeStudioPage() {
  const view = await getPrototypeStudioView();

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Prototype Studio</p>
          <h1>Template selector</h1>
        </div>
        <div className="toolbar">
          <span className={view.source === "supabase" ? "pill active" : "pill"}>{view.source}</span>
        </div>
      </div>

      {view.warning ? <div className="status">{view.warning}</div> : null}

      <section className="card stack">
        <h2>Selection brief</h2>
        <div className="toolbar">
          <span className="pill">{view.brief.productType}</span>
          <span className="pill">{view.brief.technology}</span>
          {view.brief.industryTags.map((tag) => <span className="pill" key={tag}>{tag}</span>)}
          <span className="pill">logo aspect {view.brief.logoAspectRatio ?? "unknown"}</span>
        </div>
      </section>

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Template</th>
              <th>Score</th>
              <th>Signals</th>
            </tr>
          </thead>
          <tbody>
            {view.rankedTemplates.map((template) => (
              <tr key={template.id}>
                <td>{template.rank}</td>
                <td>
                  <strong>{template.name}</strong>
                  <p className="table-note">{template.productType} / {template.technology}</p>
                </td>
                <td>{template.score}</td>
                <td>{template.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
