import { UserPosition } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import {
  ADMIN_COOKIE,
  verifyAdminToken,
  type AdminTokenPayload,
} from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  profileImageUrl: string | null;
  position: UserPosition;
};

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function requireAdminSession(): Promise<AdminTokenPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function getAdminFromSession(): Promise<SessionUser | null> {
  const session = await getAdminSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      name: true,
      profileImageUrl: true,
      position: true,
    },
  });
  if (!user) return null;
  return user;
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getAdminFromSession();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdminOnlyUser(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.position !== UserPosition.ADMIN) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
