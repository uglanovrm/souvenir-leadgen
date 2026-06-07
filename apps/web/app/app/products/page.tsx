import { getCatalogViewModel } from "../../../lib/catalog";
import { createPackageAction, deactivatePackageAction } from "./actions";

export default async function ProductsPage() {
  const catalog = await getCatalogViewModel();

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Product packages</h1>
        </div>
        <div className="toolbar">
          <span className={catalog.source === "supabase" ? "pill active" : "pill"}>{catalog.source}</span>
          <span className="pill">{catalog.canManage ? "manage" : "read-only"}</span>
        </div>
      </div>

      {catalog.warning ? <div className="status">{catalog.warning}</div> : null}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Technology</th>
              <th>MOQ</th>
              <th>From</th>
              <th>Days</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {catalog.packages.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <div className="eyebrow">{item.slug}</div>
                </td>
                <td>{item.technology}</td>
                <td>{item.minQuantity}</td>
                <td>{item.priceFrom.toLocaleString("ru-RU")} RUB</td>
                <td>{item.productionDays}</td>
                <td>
                  <span className={item.isActive ? "pill active" : "pill"}>{item.isActive ? "active" : "disabled"}</span>
                </td>
                <td>
                  {catalog.source === "supabase" && catalog.canManage ? (
                    <a className="button secondary" href={`/app/products/${item.id}/edit`}>
                      Edit
                    </a>
                  ) : null}
                  <form action={deactivatePackageAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="button secondary" type="submit" disabled={!catalog.canManage || !item.isActive || catalog.source !== "supabase"}>
                      Deactivate
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card stack">
        <h2>Create package</h2>
        <form action={createPackageAction} className="stack">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required disabled={!catalog.canManage || catalog.source !== "supabase"} />
            </div>
            <div className="field">
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" required disabled={!catalog.canManage || catalog.source !== "supabase"} />
            </div>
            <div className="field">
              <label htmlFor="technology">Technology</label>
              <input id="technology" name="technology" required disabled={!catalog.canManage || catalog.source !== "supabase"} />
            </div>
            <div className="field">
              <label htmlFor="minQuantity">MOQ</label>
              <input id="minQuantity" name="minQuantity" type="number" min="1" required disabled={!catalog.canManage || catalog.source !== "supabase"} />
            </div>
            <div className="field">
              <label htmlFor="priceFrom">Price from</label>
              <input id="priceFrom" name="priceFrom" type="number" min="0" step="0.01" required disabled={!catalog.canManage || catalog.source !== "supabase"} />
            </div>
            <div className="field">
              <label htmlFor="productionDays">Production days</label>
              <input id="productionDays" name="productionDays" type="number" min="1" required disabled={!catalog.canManage || catalog.source !== "supabase"} />
            </div>
            <div className="field">
              <label htmlFor="targetIndustries">Target industries</label>
              <input id="targetIndustries" name="targetIndustries" placeholder="hr, events" disabled={!catalog.canManage || catalog.source !== "supabase"} />
            </div>
            <div className="field">
              <label htmlFor="marginPercent">Margin %</label>
              <input id="marginPercent" name="marginPercent" type="number" min="0" step="0.01" defaultValue="0" disabled={!catalog.canManage || catalog.source !== "supabase"} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" disabled={!catalog.canManage || catalog.source !== "supabase"} />
          </div>
          <button className="button" type="submit" disabled={!catalog.canManage || catalog.source !== "supabase"}>
            Create package
          </button>
        </form>
      </section>
    </div>
  );
}
