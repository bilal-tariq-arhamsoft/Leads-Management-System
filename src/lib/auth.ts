import { SignJWT, jwtVerify } from "jose";
import { isUserPosition, type UserPosition as UserPositionType } from "@/lib/user-position";

export const ADMIN_COOKIE = "admin_token";
export const JWT_EXPIRY = "7d";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "dev-only-change-in-production";
  return new TextEncoder().encode(secret);
}

export type AdminTokenPayload = {
  sub: string;
  email: string;
  position: UserPositionType;
};

function parsePosition(value: unknown): UserPositionType | null {
  return isUserPosition(value) ? value : null;
}

export async function signAdminToken(
  payload: AdminTokenPayload,
): Promise<string> {
  return new SignJWT({ email: payload.email, position: payload.position })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyAdminToken(
  token: string,
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = payload.sub;
    const email = payload.email;
    const position = parsePosition(payload.position);
    if (typeof sub !== "string" || typeof email !== "string" || !position) {
      return null;
    }
    return { sub, email, position };
  } catch {
    return null;
  }
}

export function getTokenFromCookieHeader(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(ADMIN_COOKIE.length + 1));
}
