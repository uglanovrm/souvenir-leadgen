import { getCurrentProfile } from "../../lib/auth";

const cards = [
  ["Catalog", "Packages must be active before offer generation can use them."],
  ["Campaigns", "Lead imports and scoring stay inside the app state."],
  ["Offers", "Drafts can be prepared, but outbound sending remains blocked."],
  ["Prototype QA", "Generated mockups need QA and approval before handoff."],
];

export default async function AppHomePage() {
  const profile = await getCurrentProfile();

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Operator dashboard</h1>
        </div>
        <div className="status">Signed in as {profile.role}. Real outbound sending is disabled.</div>
      </div>
      <section className="grid" aria-label="Workflow modules">
        {cards.map(([title, body]) => (
          <article className="card" key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
    </>
  );
}
