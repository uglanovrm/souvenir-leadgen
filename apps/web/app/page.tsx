const navItems = [
  "Dashboard",
  "Products",
  "Campaigns",
  "Offers",
  "Prototype Studio",
  "Deals",
];

const cards = [
  {
    title: "Product catalog",
    body: "Manage active souvenir packages, production constraints, and margin inputs.",
  },
  {
    title: "Campaign intake",
    body: "Import leads, keep evidence, and route every opportunity through human review.",
  },
  {
    title: "Offer safety",
    body: "Prepare message drafts only. Sending stays blocked until explicit approval.",
  },
  {
    title: "Prototype Studio",
    body: "Use runtime mockup packs and QA gates before any client-facing artifact.",
  },
];

export default function HomePage() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Souvenir Lead-Gen</div>
        <nav className="nav" aria-label="Main navigation">
          {navItems.map((item, index) => (
            <a key={item} href="#" data-active={index === 0}>
              {item}
            </a>
          ))}
        </nav>
      </aside>
      <main className="main">
        <div className="page-header">
          <div>
            <p className="eyebrow">MVP foundation</p>
            <h1>Offer workflow with human approval</h1>
          </div>
          <div className="status">Outbound messages are disabled by design.</div>
        </div>
        <section className="grid" aria-label="Core modules">
          {cards.map((card) => (
            <article className="card" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
