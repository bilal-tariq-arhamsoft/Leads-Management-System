import { UserPosition } from "@prisma/client";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  position: UserPosition;
};

export type CreateUserFieldErrors = Partial<
  Record<"name" | "email" | "password" | "position", string>
>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSITION_VALUES = new Set<string>(Object.values(UserPosition));

function trimRequired(
  value: unknown,
  field: string,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `${field} is required` };
  }
  return { ok: true, value: value.trim() };
}

export function parseCreateUserBody(
  body: unknown,
): { data: CreateUserInput } | { errors: CreateUserFieldErrors } {
  if (!body || typeof body !== "object") {
    return { errors: { name: "Invalid request body" } };
  }

  const raw = body as Record<string, unknown>;
  const errors: CreateUserFieldErrors = {};

  const nameResult = trimRequired(raw.name, "Name");
  const name = nameResult.ok ? nameResult.value : undefined;
  if (!name) errors.name = nameResult.ok ? "" : nameResult.error;

  const emailRaw =
    typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  if (!emailRaw) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(emailRaw)) {
    errors.email = "Enter a valid email address";
  }

  const password =
    typeof raw.password === "string" ? raw.password : "";
  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  const positionRaw =
    typeof raw.position === "string" ? raw.position.trim().toUpperCase() : "";
  if (!positionRaw || !POSITION_VALUES.has(positionRaw)) {
    errors.position = "Select admin or manager";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
      name: name!,
      email: emailRaw,
      password,
      position: positionRaw as UserPosition,
    },
  };
}
