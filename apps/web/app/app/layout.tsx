import Link from "next/link";
import { getCurrentProfile } from "../../lib/auth";
import { canSeeNavItem, navItems } from "../../lib/permissions";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();
  const visibleItems = navItems.filter((item) => canSeeNavItem(profile.role, item));

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Souvenir Lead-Gen</div>
        <nav className="nav" aria-label="Main navigation">
          {visibleItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="profile">
          <strong>{profile.fullName}</strong>
          <span>{profile.role}</span>
          {profile.source === "demo" ? <div>Demo mode</div> : null}
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
