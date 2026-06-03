import { UserPosition, type UserPosition as UserPositionType } from "@/lib/user-position";

export const ADMIN_ONLY_PATHS = [
  "/lead-permission",
  "/create-user",
] as const;

/** Old /admin/* URLs → new paths */
export const LEGACY_ADMIN_REDIRECTS: Record<string, string> = {
  "/admin": "/dashboard",
  "/admin/login": "/login",
  "/admin/dashboard": "/dashboard",
  "/admin/leads": "/leads",
  "/admin/lead-permission": "/lead-permission",
  "/admin/create-user": "/create-user",
};

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isAdminOnlyApiPath(pathname: string): boolean {
  if (pathname.startsWith("/api/admin/users")) return true;
  if (pathname.startsWith("/api/admin/lead-form")) return true;
  return false;
}

export function canAccessAppPath(
  pathname: string,
  position: UserPositionType,
): boolean {
  if (position === UserPosition.ADMIN) return true;
  if (isAdminOnlyPath(pathname)) return false;
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/leads" ||
    pathname.startsWith("/leads/")
  );
}

export function managerAssignedUserIdFilter(managerUserId: string): string {
  return managerUserId.trim();
}
