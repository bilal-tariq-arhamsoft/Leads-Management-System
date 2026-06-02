import { UserPosition } from "@prisma/client";
import { redirect } from "next/navigation";
import CreateUserForm from "@/components/CreateUserForm";
import { getAdminFromSession } from "@/lib/admin-session";

export default async function CreateUserPage() {
  const user = await getAdminFromSession();
  if (!user || user.position !== UserPosition.ADMIN) {
    redirect("/dashboard");
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
        Create User
      </h1>
      <p className="mb-6 text-sm text-neutral-600">
        Add a new user with name, email, password, and position.
      </p>
      <CreateUserForm />
    </div>
  );
}
