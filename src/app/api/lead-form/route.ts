import { prisma } from "@/app/lib/prisma";
import { parseCreateLeadFormBody } from "@/lib/lead-form-create";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseCreateLeadFormBody(body);
  if ("errors" in parsed) {
    return Response.json({ errors: parsed.errors }, { status: 400 });
  }

  const { data } = parsed;

  try {
    const leadForm = await prisma.leadForm.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        position: data.position,
        source: data.source,
        status: data.status,
        message: data.message,
      },
      select: { id: true },
    });

    return Response.json({ id: leadForm.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/lead-form failed:", error);
    return Response.json(
      { error: "Failed to save form. Please try again." },
      { status: 500 },
    );
  }
}
