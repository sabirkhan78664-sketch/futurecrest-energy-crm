import { requireRole } from "@/lib/auth";
import MainLayout from "@/components/layout/MainLayout";
import UsersClient from "@/components/users/UsersClient";
import Link from "next/link";
import { getUsers } from "@/lib/users";

export default async function UsersPage() {
  await requireRole(["Super Admin"]);

  const users = await getUsers();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-slate-500">Manage CRM Users</p>
          </div>

          <Link
            href="/users/new"
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            + Add User
          </Link>
        </div>

        <UsersClient users={users} />
      </div>
    </MainLayout>
  );
}