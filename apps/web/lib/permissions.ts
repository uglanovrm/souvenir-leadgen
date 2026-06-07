import type { AppRole } from "@souvenir-leadgen/shared";

export type NavItem = {
  href: string;
  label: string;
  roles: AppRole[];
};

export const navItems: NavItem[] = [
  { href: "/app", label: "Dashboard", roles: ["admin", "producer", "agent", "manager"] },
  { href: "/app/products", label: "Products", roles: ["admin", "producer", "agent", "manager"] },
  { href: "/app/assets", label: "Assets", roles: ["admin", "producer", "agent", "manager"] },
  { href: "/app/brand-assets", label: "Brand Logos", roles: ["admin", "producer", "manager"] },
  { href: "/app/mockup-sources", label: "Mockup Sources", roles: ["admin", "producer"] },
  { href: "/app/mockup-templates", label: "Mockup Packs", roles: ["admin", "producer"] },
  { href: "/app/campaigns", label: "Campaigns", roles: ["admin", "agent", "manager"] },
  { href: "/app/offers", label: "Offers", roles: ["admin", "producer", "agent", "manager"] },
  { href: "/app/prototype-studio", label: "Prototype Studio", roles: ["admin", "producer", "manager"] },
  { href: "/app/deals", label: "Deals", roles: ["admin", "manager"] },
  { href: "/app/settings", label: "Settings", roles: ["admin"] },
];

export function canSeeNavItem(role: AppRole, item: NavItem) {
  return item.roles.includes(role);
}

export function canManageCatalog(role: AppRole) {
  return role === "admin" || role === "producer";
}

export function canManageAssets(role: AppRole) {
  return role === "admin" || role === "producer";
}

export function canApproveOutbound(role: AppRole) {
  return role === "admin" || role === "manager";
}
