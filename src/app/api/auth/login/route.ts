import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { ADMIN_COOKIE, signAdminToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth-password";
import { ensureDefaultAdminUser } from "@/lib/ensure-default-admin";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const email =
    typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const password = typeof raw.password === "string" ? raw.password : "";

  if (!email || !password) {
    return Response.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  try {
    await ensureDefaultAdminUser();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await signAdminToken({
      sub: user.id,
      email: user.email,
      position: user.position,
    });

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return Response.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        position: user.position,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);
    const message =
      error instanceof Error ? error.message : "Login failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
