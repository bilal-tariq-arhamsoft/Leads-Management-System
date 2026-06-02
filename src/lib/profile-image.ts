const MAX_PROFILE_IMAGE_BYTES = 500_000;
const ALLOWED_DATA_URL_PREFIXES = [
  "data:image/jpeg;base64,",
  "data:image/png;base64,",
  "data:image/webp;base64,",
] as const;

export function validateProfileImageUrl(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "Profile image must be a string" };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true, value: null };
  }
  const hasAllowedPrefix = ALLOWED_DATA_URL_PREFIXES.some((prefix) =>
    trimmed.startsWith(prefix),
  );
  if (!hasAllowedPrefix) {
    return {
      ok: false,
      error: "Profile image must be a JPEG, PNG, or WebP file",
    };
  }
  if (trimmed.length > MAX_PROFILE_IMAGE_BYTES) {
    return {
      ok: false,
      error: "Profile image is too large (max 500 KB)",
    };
  }
  return { ok: true, value: trimmed };
}
