import { prisma } from "@/app/lib/prisma";
import { hashPassword } from "@/lib/auth-password";
import { requireAdminOnlyUser } from "@/lib/admin-session";
import { parseCreateUserBody } from "@/lib/user-create";

export async function POST(request: Request) {
  try {
    await requireAdminOnlyUser();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseCreateUserBody(body);
  if ("errors" in parsed) {
    return Response.json({ errors: parsed.errors }, { status: 400 });
  }

  const { name, email, password, position } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, position },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        createdAt: true,
      },
    });

    return Response.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    const isDuplicate =
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002";
    if (isDuplicate) {
      return Response.json(
        { errors: { email: "A user with this email already exists" } },
        { status: 409 },
      );
    }
    console.error("POST /api/admin/users failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return Response.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "Failed to create user",
      },
      { status: 500 },
    );
  }
}
