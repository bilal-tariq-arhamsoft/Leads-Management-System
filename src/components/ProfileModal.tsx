"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { getUserInitials } from "@/lib/user-avatar";

const inputClassName =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export type ProfileUser = {
  name: string;
  email: string;
  profileImageUrl: string | null;
};

type ProfileModalProps = {
  open: boolean;
  user: ProfileUser;
  onClose: () => void;
  onSaved: (user: ProfileUser) => void;
};

export default function ProfileModal({
  open,
  user,
  onClose,
  onSaved,
}: ProfileModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    user.profileImageUrl,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(user.name);
    setProfileImageUrl(user.profileImageUrl);
    setError(null);
  }, [open, user]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleDialogClose() {
    onClose();
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > 500_000) {
      setError("Image must be 500 KB or smaller");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileImageUrl(reader.result);
        setError(null);
      }
    };
    reader.onerror = () => setError("Could not read image file");
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, profileImageUrl }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : `Failed to save profile (${res.status})`,
        );
        return;
      }

      const updated = data.user as ProfileUser;
      onSaved({
        name: updated.name,
        email: updated.email,
        profileImageUrl: updated.profileImageUrl ?? null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleDialogClose}
      className="m-auto w-full max-w-md rounded-lg border border-neutral-200 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-black/40"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Profile</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Update your name and profile photo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close profile"
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative">
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImageUrl}
                alt=""
                className="h-24 w-24 rounded-full object-cover ring-2 ring-neutral-200"
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-200 text-xl font-semibold text-neutral-700 ring-2 ring-neutral-200"
                aria-hidden
              >
                {getUserInitials(name)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {profileImageUrl ? "Change photo" : "Add photo"}
            </button>
            {profileImageUrl ? (
              <button
                type="button"
                onClick={() => setProfileImageUrl(null)}
                className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Remove
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleImageChange}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="profile-name"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={user.email}
              readOnly
              disabled
              className={`${inputClassName} cursor-not-allowed bg-neutral-100 text-neutral-500`}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Email cannot be changed.
            </p>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
