"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileModal, { type ProfileUser } from "@/components/ProfileModal";
import { getUserInitials } from "@/lib/user-avatar";

type AppHeaderProps = {
  user: ProfileUser;
};

function ProfileAvatar({
  name,
  profileImageUrl,
  size = "md",
}: {
  name: string;
  profileImageUrl: string | null;
  size?: "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-24 w-24 text-xl" : "h-9 w-9 text-sm";
  if (profileImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profileImageUrl}
        alt=""
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }
  return (
    <div
      className={`flex ${sizeClass} items-center justify-center rounded-full bg-neutral-800 font-semibold text-white ring-2 ring-white`}
      aria-hidden
    >
      {getUserInitials(name)}
    </div>
  );
}

export default function AppHeader({ user: initialUser }: AppHeaderProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<ProfileUser>(initialUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function openProfile() {
    setMenuOpen(false);
    setProfileOpen(true);
  }

  function handleProfileSaved(updated: ProfileUser) {
    setUser(updated);
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-end border-b border-neutral-200 bg-white px-6">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-full outline-none ring-neutral-300 transition hover:opacity-90 focus-visible:ring-2"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            <ProfileAvatar
              name={user.name}
              profileImageUrl={user.profileImageUrl}
            />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-44 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={openProfile}
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Profile
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <ProfileModal
        open={profileOpen}
        user={user}
        onClose={() => setProfileOpen(false)}
        onSaved={handleProfileSaved}
      />
    </>
  );
}
