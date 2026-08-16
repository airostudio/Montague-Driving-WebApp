import type { UserRole } from "@/types/database";

export interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Route Planner", href: "/planner" },
  { label: "Trucks", href: "/trucks" },
  { label: "Routes", href: "/routes" },
  { label: "Locations", href: "/locations" },
  { label: "Drivers", href: "/drivers", roles: ["fleet_manager", "company_admin", "platform_admin"] },
  { label: "Company", href: "/company", roles: ["company_admin", "platform_admin"] },
  { label: "Settings", href: "/settings" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Restrictions", href: "/admin/restrictions" },
  { label: "Data Sources", href: "/admin/data-sources" },
];
