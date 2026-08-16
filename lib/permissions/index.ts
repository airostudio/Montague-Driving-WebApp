import type { UserRole } from "@/types/database";

export const ROLE_LABELS: Record<UserRole, string> = {
  driver: "Driver",
  dispatcher: "Dispatcher",
  fleet_manager: "Fleet Manager",
  company_admin: "Company Admin",
  platform_admin: "Platform Admin",
};

const MANAGE_TRUCKS: UserRole[] = ["fleet_manager", "company_admin", "platform_admin"];
const MANAGE_DRIVERS: UserRole[] = ["fleet_manager", "company_admin", "platform_admin"];
const MANAGE_COMPANY: UserRole[] = ["company_admin", "platform_admin"];
const MANAGE_RESTRICTIONS: UserRole[] = ["platform_admin"];

export function canManageTrucks(role: UserRole) {
  return MANAGE_TRUCKS.includes(role);
}

export function canManageDrivers(role: UserRole) {
  return MANAGE_DRIVERS.includes(role);
}

export function canManageCompany(role: UserRole) {
  return MANAGE_COMPANY.includes(role);
}

export function canManageRestrictions(role: UserRole) {
  return MANAGE_RESTRICTIONS.includes(role);
}

export function isPlatformAdmin(role: UserRole) {
  return role === "platform_admin";
}
