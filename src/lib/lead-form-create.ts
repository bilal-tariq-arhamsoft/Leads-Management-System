import { LeadSource } from "@prisma/client";

export type CreateLeadFormInput = {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source: LeadSource;
  message?: string;
};

export type CreateLeadFormFieldErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "company"
    | "position"
    | "source"
    | "message",
    string
  >
>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimOptional(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function trimRequired(
  value: unknown,
  field: string,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `${field} is required` };
  }
  return { ok: true, value: value.trim() };
}

export function parseCreateLeadFormBody(
  body: unknown,
): { data: CreateLeadFormInput } | { errors: CreateLeadFormFieldErrors } {
  if (!body || typeof body !== "object") {
    return { errors: { firstName: "Invalid request body" } };
  }

  const raw = body as Record<string, unknown>;
  const errors: CreateLeadFormFieldErrors = {};

  const firstNameResult = trimRequired(raw.firstName, "First name");
  const firstName = firstNameResult.ok ? firstNameResult.value : undefined;
  if (!firstName) errors.firstName = firstNameResult.ok ? "" : firstNameResult.error;

  const lastName = trimOptional(raw.lastName);

  const emailResult = trimRequired(raw.email, "Email");
  const email = emailResult.ok ? emailResult.value.toLowerCase() : undefined;
  if (!email) {
    errors.email = emailResult.ok ? "" : emailResult.error;
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address";
  }

  const phone = trimOptional(raw.phone);
  const company = trimOptional(raw.company);
  const position = trimOptional(raw.position);
  const message = trimOptional(raw.message);

  const sourceRaw = typeof raw.source === "string" ? raw.source.trim() : "";
  const source = Object.values(LeadSource).includes(sourceRaw as LeadSource)
    ? (sourceRaw as LeadSource)
    : undefined;
  if (!source) errors.source = "Select a lead source";

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
      firstName: firstName!,
      lastName,
      email: email!,
      phone,
      company,
      position,
      source: source!,
      message,
    },
  };
}
