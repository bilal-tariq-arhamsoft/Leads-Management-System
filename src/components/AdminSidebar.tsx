"use client";

import { UserPosition } from "@prisma/client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ALL_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", roles: "all" as const },
  { href: "/leads", label: "Leads", roles: "all" as const },
  {
    href: "/lead-permission",
    label: "Lead Permission",
    roles: "admin" as const,
  },
  { href: "/create-user", label: "Create User", roles: "admin" as const },
] as const;

type AdminSidebarProps = {
  position: UserPosition;
};

export default function AdminSidebar({ position }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = ALL_NAV_ITEMS.filter(
    (item) =>
      item.roles === "all" ||
      (item.roles === "admin" && position === UserPosition.ADMIN),
  );

  return (
    <aside className="flex min-h-screen w-56 shrink-0 flex-col border-r border-neutral-200 bg-white text-neutral-900">
      <div className="border-b border-neutral-200 px-5 py-5">
        <p className="text-sm font-semibold tracking-wide text-neutral-900">
          Lead Manager
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
