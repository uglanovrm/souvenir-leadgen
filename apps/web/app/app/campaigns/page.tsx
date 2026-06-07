import Link from "next/link";
import { listCampaigns } from "../../../lib/campaigns";
import { createCampaignAction } from "./actions";

export default async function CampaignsPage() {
  const view = await listCampaigns();
  const disabled = view.source !== "supabase";

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Campaigns</p>
          <h1>Campaign builder</h1>
        </div>
        <span className={view.source === "supabase" ? "pill active" : "pill"}>{view.source}</span>
      </div>

      {view.warning ? <div className="status">{view.warning}</div> : null}

      <section className="card stack">
        <h2>Create campaign</h2>
        <form action={createCampaignAction} className="stack">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor="targetIndustries">Target industries</label>
              <input id="targetIndustries" name="targetIndustries" placeholder="hr, education" disabled={disabled} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" disabled={disabled} />
          </div>
          <button className="button" type="submit" disabled={disabled}>
            Create campaign
          </button>
        </form>
      </section>

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Leads</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {view.campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>
                  <strong>{campaign.name}</strong>
                  <div className="eyebrow">{campaign.description}</div>
                </td>
                <td>{campaign.status}</td>
                <td>{campaign.leadCount}</td>
                <td>
                  <Link className="button secondary" href={`/app/campaigns/${campaign.id}`}>
                    Open
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
