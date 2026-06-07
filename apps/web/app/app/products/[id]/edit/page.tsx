import { notFound } from "next/navigation";
import { getProductPackageForEdit } from "../../../../../lib/catalog";
import { updatePackageAction } from "./actions";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const view = await getProductPackageForEdit(id);
  const product = view.package;

  if (!product) {
    notFound();
  }

  const disabled = !view.canManage || view.source !== "supabase";

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Edit product package</h1>
        </div>
        <a className="button secondary" href="/app/products">
          Back
        </a>
      </div>

      {view.warning ? <div className="status">{view.warning}</div> : null}

      <section className="card stack">
        <form action={updatePackageAction.bind(null, product.id)} className="stack">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" defaultValue={product.name} required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" defaultValue={product.slug} required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="technology">Technology</label>
              <input id="technology" name="technology" defaultValue={product.technology} required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="minQuantity">MOQ</label>
              <input id="minQuantity" name="minQuantity" type="number" min="1" defaultValue={product.minQuantity} required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="priceFrom">Price from</label>
              <input id="priceFrom" name="priceFrom" type="number" min="0" step="0.01" defaultValue={product.priceFrom} required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="productionDays">Production days</label>
              <input id="productionDays" name="productionDays" type="number" min="1" defaultValue={product.productionDays} required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="targetIndustries">Target industries</label>
              <input id="targetIndustries" name="targetIndustries" defaultValue={product.targetIndustries.join(", ")} disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="marginPercent">Margin %</label>
              <input id="marginPercent" name="marginPercent" type="number" min="0" step="0.01" defaultValue={product.marginPercent ?? 0} disabled={disabled} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" defaultValue={product.description ?? ""} disabled={disabled} />
          </div>
          <button className="button" type="submit" disabled={disabled}>
            Save package
          </button>
        </form>
      </section>
    </div>
  );
}
