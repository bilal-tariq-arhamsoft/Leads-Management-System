import { UserPosition } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";
import {
  canAccessAppPath,
  isAdminOnlyApiPath,
  LEGACY_ADMIN_REDIRECTS,
} from "@/lib/role-access";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/leads",
  "/lead-permission",
  "/create-user",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function legacyRedirect(pathname: string, request: NextRequest): NextResponse | null {
  const target = LEGACY_ADMIN_REDIRECTS[pathname];
  if (!target) return null;
  const url = new URL(target, request.url);
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacy = legacyRedirect(pathname, request);
  if (legacy) return legacy;

  const needsAuth =
    isProtectedPage(pathname) || pathname.startsWith("/api/admin");
  if (!needsAuth) return NextResponse.next();

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.position !== UserPosition.ADMIN) {
    if (isAdminOnlyApiPath(pathname)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isProtectedPage(pathname) && !canAccessAppPath(pathname, session.position)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/leads/:path*",
    "/lead-permission/:path*",
    "/create-user/:path*",
    "/api/admin/:path*",
  ],
};
