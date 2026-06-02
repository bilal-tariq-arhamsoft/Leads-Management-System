"use client";

import { UserPosition } from "@prisma/client";
import { FormEvent, useState } from "react";

const inputClassName =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";
const selectClassName = inputClassName;

const POSITION_OPTIONS: { value: UserPosition; label: string }[] = [
  { value: UserPosition.ADMIN, label: "Admin" },
  { value: UserPosition.MANAGER, label: "Manager" },
];

type FieldErrors = Partial<
  Record<"name" | "email" | "password" | "position", string>
>;

export default function CreateUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [position, setPosition] = useState<UserPosition | "">("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    setGeneralError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, email, password, position }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.errors && typeof data.errors === "object") {
          setFieldErrors(data.errors as FieldErrors);
        } else {
          setGeneralError(
            typeof data.error === "string"
              ? data.error
              : `Failed to save user (${res.status})`,
          );
        }
        return;
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setPassword("");
      setPosition("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClassName}
        />
        {fieldErrors.name ? (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClassName}
        />
        {fieldErrors.email ? (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClassName}
        />
        {fieldErrors.password ? (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="position"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Position
        </label>
        <select
          id="position"
          required
          value={position}
          onChange={(e) =>
            setPosition(e.target.value as UserPosition | "")
          }
          className={selectClassName}
        >
          <option value="" disabled>
            Select position
          </option>
          {POSITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {fieldErrors.position ? (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.position}</p>
        ) : null}
      </div>

      {generalError ? (
        <p className="text-sm text-red-600">{generalError}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-700">User saved successfully.</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
