import Link from "next/link";
import { listOffers } from "../../../lib/offers";

export default async function OffersPage() {
  const view = await listOffers();

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Offer Studio</p>
          <h1>Generated offers</h1>
        </div>
      </div>

      {view.warning ? <div className="status">{view.warning}</div> : null}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Offer</th>
              <th>Organization</th>
              <th>Package</th>
              <th>Status</th>
              <th>Warnings</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {view.offers.map((offer) => (
              <tr key={offer.id}>
                <td>
                  <strong>{offer.title}</strong>
                  <p className="table-note">Updated {new Date(offer.updatedAt).toLocaleString("en-US")}</p>
                </td>
                <td>{offer.organizationName}</td>
                <td>{offer.packageName}</td>
                <td>
                  <span className={offer.status === "approved" ? "pill active" : "pill"}>{offer.status}</span>
                </td>
                <td>{offer.warningCount}</td>
                <td>
                  <Link className="button secondary" href={`/app/offers/${offer.id}`}>
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
