import { prisma } from "@/app/lib/prisma";
import { requireSessionUser } from "@/lib/admin-session";
import { validateProfileImageUrl } from "@/lib/profile-image";

function profileSelect() {
  return {
    id: true,
    email: true,
    name: true,
    profileImageUrl: true,
    position: true,
  } as const;
}

export async function GET() {
  try {
    const sessionUser = await requireSessionUser();
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: profileSelect(),
    });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json({ user });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const sessionUser = await requireSessionUser();
    const raw = body as Record<string, unknown>;

    const data: { name?: string; profileImageUrl?: string | null } = {};

    if (raw.name !== undefined) {
      const name = typeof raw.name === "string" ? raw.name.trim() : "";
      if (!name) {
        return Response.json({ error: "Name is required" }, { status: 400 });
      }
      if (name.length > 120) {
        return Response.json(
          { error: "Name must be 120 characters or fewer" },
          { status: 400 },
        );
      }
      data.name = name;
    }

    if (raw.profileImageUrl !== undefined) {
      const imageResult = validateProfileImageUrl(raw.profileImageUrl);
      if (!imageResult.ok) {
        return Response.json({ error: imageResult.error }, { status: 400 });
      }
      data.profileImageUrl = imageResult.value;
    }

    if (Object.keys(data).length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data,
      select: profileSelect(),
    });

    return Response.json({ user });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
