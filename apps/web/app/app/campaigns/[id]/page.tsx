import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaignDetail } from "../../../../lib/campaigns";
import { importCampaignCsvAction, scoreCampaignLeadAction } from "./actions";

type CampaignDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params;
  const view = await getCampaignDetail(id);

  if (!view.campaign) {
    notFound();
  }

  const campaign = view.campaign;
  const disabled = view.source !== "supabase";

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Campaign</p>
          <h1>{campaign.name}</h1>
        </div>
        <Link className="button secondary" href="/app/campaigns">
          Back
        </Link>
      </div>

      {view.warning ? <div className="status">{view.warning}</div> : null}

      <section className="card stack">
        <h2>CSV import</h2>
        <form action={importCampaignCsvAction.bind(null, campaign.id)} className="stack">
          <div className="field">
            <label htmlFor="csv">CSV file</label>
            <input id="csv" name="csv" type="file" accept=".csv,text/csv" required disabled={disabled} />
          </div>
          <div className="status">Expected columns: `name`, `website`, `inn`, `contactName`, `contactEmail`, `industry`.</div>
          <button className="button" type="submit" disabled={disabled}>
            Import CSV
          </button>
        </form>
      </section>

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Status</th>
              <th>Score</th>
              <th>Explanation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {campaign.leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.organizationName}</td>
                <td>{lead.status}</td>
                <td>{lead.score ?? "not scored"}</td>
                <td>{lead.explanation ?? "not scored yet"}</td>
                <td>
                  <form action={scoreCampaignLeadAction.bind(null, campaign.id)}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <button className="button secondary" type="submit" disabled={disabled}>
                      Score
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
