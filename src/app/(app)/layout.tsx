import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import AppHeader from "@/components/AppHeader";
import { getAdminFromSession } from "@/lib/admin-session";

export default async function AppPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminFromSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar position={user.position} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppHeader
          user={{
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl,
          }}
        />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
